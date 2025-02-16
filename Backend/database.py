import aiomysql
from datetime import datetime
from dotenv import load_dotenv
import os

load_dotenv()

# Database connection details
DATABASE_CONFIG = {
    "host": os.getenv('DB_HOST'),
    "port": int(os.getenv('DB_PORT')),
    "user": os.getenv('DB_USER'),          # Replace with your MySQL username
    "password": os.getenv('DB_PASSWORD'),  # Replace with your MySQL password
    "db": "test_db",         # Replace with your database name
}

async def get_db_connection():
    try:
        conn = await aiomysql.connect(**DATABASE_CONFIG)
        print("Successfully connected to the database.")
        return conn
    except Exception as e:
        print(f"Failed to connect to the database: {e}")
        raise

async def create_tables():
    conn = await get_db_connection()
    async with conn.cursor() as cursor:
        # Create random_numbers table
        await cursor.execute("""
            CREATE TABLE IF NOT EXISTS random_numbers (
                id INT AUTO_INCREMENT PRIMARY KEY,
                timestamp DATETIME NOT NULL,
                value INT NOT NULL
            );
        """)
        # Create user_sessions table
        await cursor.execute("""
            CREATE TABLE IF NOT EXISTS user_sessions (
                id INT AUTO_INCREMENT PRIMARY KEY,
                username VARCHAR(255) NOT NULL,
                token TEXT NOT NULL,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            );
        """)
    await conn.commit()
    conn.close()

async def store_random_number(timestamp: datetime, value: int):
    conn = await get_db_connection()
    async with conn.cursor() as cursor:
        await cursor.execute("INSERT INTO random_numbers (timestamp, value) VALUES (%s, %s)", (timestamp, value))
    await conn.commit()
    conn.close()

async def get_latest_random_number():
    conn = await get_db_connection()
    async with conn.cursor() as cursor:
        await cursor.execute("SELECT value FROM random_numbers ORDER BY timestamp DESC LIMIT 1")
        result = await cursor.fetchone()
    conn.close()
    return result[0] if result else None

async def store_user_session(username: str, token: str):
    conn = await get_db_connection()
    async with conn.cursor() as cursor:
        await cursor.execute("INSERT INTO user_sessions (username, token) VALUES (%s, %s)", (username, token))
    await conn.commit()
    conn.close()

async def validate_user_session(token: str):
    conn = await get_db_connection()
    async with conn.cursor() as cursor:
        await cursor.execute("SELECT username FROM user_sessions WHERE token = %s", (token,))
        result = await cursor.fetchone()
    conn.close()
    return result[0] if result else None