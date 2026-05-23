-- create user (if not present)
CREATE USER app_user WITH PASSWORD 'app_pass';

-- create DB owned by app_user (if DB doesn't exist)
CREATE DATABASE app_db OWNER app_user;

-- OR if DB exists, change owner
ALTER DATABASE app_db OWNER TO app_user;

-- connect to DB and fix schema owner/permissions

ALTER SCHEMA public OWNER TO app_user;
GRANT USAGE, CREATE ON SCHEMA public TO app_user;