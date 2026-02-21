-- assignments 테이블에 접수일자, 상품명 컬럼 추가
ALTER TABLE assignments ADD COLUMN order_date TEXT;
ALTER TABLE assignments ADD COLUMN product_name TEXT;
