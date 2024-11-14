\c flashcardsdb;

CREATE TABLE IF NOT EXISTS flashcard_sets (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    subject VARCHAR(255) NOT NULL,
    creator_id INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS flashcards (
    id SERIAL PRIMARY KEY,
    set_id INT REFERENCES flashcard_sets(id) ON DELETE CASCADE,
    question TEXT NOT NULL,
    answer TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS transactions (
    transaction_id VARCHAR(36) PRIMARY KEY,
    status VARCHAR(10) NOT NULL, -- 'pending', 'prepared', 'committed', 'aborted'
    data JSONB -- Storing the data to commit in JSON format (for simplicity)
);