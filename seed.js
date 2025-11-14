// seed.js
import fs from "fs";
import { pool } from "./src/config/db.js";
import { from as copyFrom } from "pg-copy-streams";

/**
 * CSV 파일을 PostgreSQL 테이블로 COPY하는 헬퍼 함수
 * @param {object} client - PostgreSQL 클라이언트
 * @param {string} tableName - 테이블 이름
 * @param {string} filePath - CSV 파일 경로
 */
async function loadCsv(client, tableName, filePath) {
  console.log(`Loading ${filePath} into ${tableName}...`);
  return new Promise((resolve, reject) => {
    // CSV HEADER 옵션: CSV 첫 줄의 헤더를 DB 컬럼명과 자동으로 매핑합니다.
    const copyCommand = `COPY ${tableName} FROM STDIN CSV HEADER`;
    const stream = client.query(copyFrom(copyCommand));
    const fileStream = fs.createReadStream(filePath);

    fileStream.on("error", (err) => {
      fileStream.destroy();
      reject(new Error(`File stream error for ${filePath}: ${err.message}`));
    });
    stream.on("error", (err) => {
      stream.destroy();
      reject(new Error(`DB stream error for ${tableName}: ${err.message}`));
    });
    stream.on("finish", () => {
      console.log(`✅ Finished loading ${filePath}`);
      resolve();
    });

    // 파일 스트림을 DB 스트림으로 파이핑
    fileStream.pipe(stream);
  });
}

/**
 * 메인 시딩 함수
 */
async function seedDatabase() {
  const client = await pool.connect();
  try {
    await client.query("BEGIN"); // 1. 트랜잭션 시작

    console.log("Clearing old data...");
    // 2. 외래 키 제약조건의 역순으로 테이블 비우기
    await client.query(
      "TRUNCATE menu_categories, menus, categories, restaurants RESTART IDENTITY"
    );

    // 3. 외래 키 제약조건의 순서대로 테이블 채우기
    // (CSV 파일명은 실제 파일명과 일치해야 합니다)
    await loadCsv(client, "restaurants", "./restaurants.csv");
    await loadCsv(client, "categories", "./categories.csv");
    await loadCsv(client, "menus", "./menus.csv");
    await loadCsv(client, "menu_categories", "./menu_categories.csv");

    await client.query("COMMIT"); // 4. 성공 시 커밋
    console.log("🎉 Database seeding successful!");
  } catch (error) {
    await client.query("ROLLBACK"); // 5. 실패 시 롤백
    console.error("❌ Database seeding failed:", error.message);
  } finally {
    client.release(); // 6. 클라이언트 반환
    pool.end(); // 7. 스크립트 종료 시 풀 닫기
  }
}

// 스크립트 실행
seedDatabase();
