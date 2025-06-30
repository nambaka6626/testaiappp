CREATE TABLE [User] (
    user_id INT IDENTITY(1,1) PRIMARY KEY,
    email NVARCHAR(255) UNIQUE NOT NULL,
    password_hash NVARCHAR(255) NOT NULL,
    created_at DATETIME DEFAULT GETDATE()
);

CREATE TABLE Document (
    doc_id INT IDENTITY(1,1) PRIMARY KEY,
    user_id INT NOT NULL,
    title NVARCHAR(255),
    content NVARCHAR(MAX) NOT NULL,
    upload_time DATETIME DEFAULT GETDATE(),
    language_code NVARCHAR(10) DEFAULT 'en',
    FOREIGN KEY (user_id) REFERENCES [User](user_id)
);

CREATE TABLE Suggestion (
    suggestion_id INT IDENTITY(1,1) PRIMARY KEY,
    replacement_text NVARCHAR(255),
    description NVARCHAR(500)
);

CREATE TABLE GrammarError (
    error_id INT IDENTITY(1,1) PRIMARY KEY,
    doc_id INT NOT NULL,
    sentence NVARCHAR(MAX),
    error_text NVARCHAR(MAX),
    explanation NVARCHAR(MAX),
    suggestion_id INT,
    FOREIGN KEY (doc_id) REFERENCES Document(doc_id),
    FOREIGN KEY (suggestion_id) REFERENCES Suggestion(suggestion_id)
);

CREATE TABLE CorrectionHistory (
    history_id INT IDENTITY(1,1) PRIMARY KEY,
    user_id INT NOT NULL,
    doc_id INT NOT NULL,
    original_text NVARCHAR(MAX),
    corrected_text NVARCHAR(MAX),
    corrected_at DATETIME DEFAULT GETDATE(),
    FOREIGN KEY (user_id) REFERENCES [User](user_id),
    FOREIGN KEY (doc_id) REFERENCES Document(doc_id)
);
