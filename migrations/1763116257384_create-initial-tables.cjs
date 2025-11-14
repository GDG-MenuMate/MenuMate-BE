// migrations/[타임스탬프]_create_initial_tables.cjs

exports.shorthands = undefined;

exports.up = (pgm) => {
  pgm.sql(`
    -- 1. 식당 테이블
    CREATE TABLE restaurants (
        restaurants_id INT PRIMARY KEY,
        name VARCHAR(255),
        address VARCHAR(255),
        open_time TIME,
        close_time TIME,
        url VARCHAR(255),
        latitude DOUBLE PRECISION,
        longitude DOUBLE PRECISION,
        rating DECIMAL(3, 1)
    );

    -- 2. 메뉴 테이블
    CREATE TABLE menus (
        name VARCHAR(255),
        restaurants_id INT REFERENCES restaurants(restaurants_id) ON DELETE CASCADE,
        description VARCHAR(255),
        price INT,
        calories INT,
        tags TEXT[],
        PRIMARY KEY (name, restaurants_id)
    );

    -- 3. 카테고리 테이블
    CREATE TABLE categories (
        category_id INT PRIMARY KEY,
        name VARCHAR(255) NOT NULL UNIQUE
    );

    -- 4. 메뉴-카테고리 조인 테이블
    CREATE TABLE menu_categories (
        menu_name VARCHAR(255),
        restaurants_id INT,
        category_id INT REFERENCES categories(category_id) ON DELETE CASCADE,
        
        -- 기본 키 설정
        PRIMARY KEY (menu_name, restaurants_id, category_id),
        
        -- 외래 키 설정
        FOREIGN KEY (menu_name, restaurants_id) 
            REFERENCES menus(name, restaurants_id) ON DELETE CASCADE
    );

    -- 인덱스
    CREATE INDEX idx_menus_restaurants_id ON menus(restaurants_id); 
    CREATE INDEX idx_menu_categories_menu ON menu_categories(menu_name, restaurants_id); 
    CREATE INDEX idx_menu_categories_category ON menu_categories(category_id);
  `);
};

exports.down = (pgm) => {
  pgm.sql(`
    -- 생성의 역순으로 삭제
    DROP TABLE menu_categories;
    DROP TABLE categories;
    DROP TABLE menus;
    DROP TABLE restaurants;
  `);
};
