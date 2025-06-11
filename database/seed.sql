CREATE TABLE IF NOT EXISTS db_sessions (
    id UUID PRIMARY KEY,
    username VARCHAR(255) NOT NULL,
    title VARCHAR(255) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO db_sessions (id, username, title) VALUES ('123e4567-e89b-12d3-a456-426614174000', 'John Doe', '🤖 Exploring AI and Machine Learning');
INSERT INTO db_sessions (id, username, title) VALUES ('123e4567-e89b-12d3-a456-426614174001', 'Jane Smith', '🌐 Web Development Best Practices');
INSERT INTO db_sessions (id, username, title) VALUES ('123e4567-e89b-12d3-a456-426614174002', 'Alice Johnson', '☁️ Cloud Architecture Discussion');
INSERT INTO db_sessions (id, username, title) VALUES ('123e4567-e89b-12d3-a456-426614174003', 'Bob Brown', '🗄️ Database Optimization Strategies');
INSERT INTO db_sessions (id, username, title) VALUES ('123e4567-e89b-12d3-a456-426614174004', 'Charlie Davis', '🔒 Cybersecurity Best Practices');
INSERT INTO db_sessions (id, username, title) VALUES ('123e4567-e89b-12d3-a456-426614174005', 'Diana White', '📱 Mobile App Development Tips');
INSERT INTO db_sessions (id, username, title) VALUES ('123e4567-e89b-12d3-a456-426614174006', 'Ethan Green', '⚙️ DevOps Pipeline Optimization');
INSERT INTO db_sessions (id, username, title) VALUES ('123e4567-e89b-12d3-a456-426614174007', 'Fiona Black', '🎨 UI/UX Design Principles');
INSERT INTO db_sessions (id, username, title) VALUES ('123e4567-e89b-12d3-a456-426614174008', 'George Blue', '🔌 API Design and Documentation');
INSERT INTO db_sessions (id, username, title) VALUES ('123e4567-e89b-12d3-a456-426614174009', 'Hannah Red', '🧪 Testing and Quality Assurance');

CREATE TABLE IF NOT EXISTS bd_chat_history (
    id SERIAL PRIMARY KEY,
    session_id UUID NOT NULL,
    message JSONB NOT NULL,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Sample chat history data
INSERT INTO bd_chat_history (session_id, message) VALUES 
('123e4567-e89b-12d3-a456-426614174000', '{
  "data": {
    "id": "01JX749S036KJ8AXTB4GH1DY56",
    "name": "Human",
    "type": "human",
    "content": "Can you explain what machine learning is?",
    "example": false,
    "tool_calls": [],
    "usage_metadata": null,
    "additional_kwargs": {},
    "response_metadata": {},
    "invalid_tool_calls": []
  },
  "type": "human"
}');

INSERT INTO bd_chat_history (session_id, message) VALUES 
('123e4567-e89b-12d3-a456-426614174000', '{
  "data": {
    "id": "01JX749S036KJ8AXTB4GH1DY57",
    "name": "Assistant",
    "type": "ai",
    "content": "Machine learning is a subset of artificial intelligence that enables systems to learn and improve from experience without being explicitly programmed.",
    "example": false,
    "tool_calls": [],
    "usage_metadata": null,
    "additional_kwargs": {},
    "response_metadata": {},
    "invalid_tool_calls": []
  },
  "type": "ai"
}');

INSERT INTO bd_chat_history (session_id, message) VALUES 
('123e4567-e89b-12d3-a456-426614174001', '{
  "data": {
    "id": "01JX749S036KJ8AXTB4GH1DY58",
    "name": "Human",
    "type": "human",
    "content": "What are the best practices for responsive web design?",
    "example": false,
    "tool_calls": [],
    "usage_metadata": null,
    "additional_kwargs": {},
    "response_metadata": {},
    "invalid_tool_calls": []
  },
  "type": "human"
}');

INSERT INTO bd_chat_history (session_id, message) VALUES 
('123e4567-e89b-12d3-a456-426614174001', '{
  "data": {
    "id": "01JX749S036KJ8AXTB4GH1DY59",
    "name": "Assistant",
    "type": "ai",
    "content": "Key responsive web design practices include using fluid grids, flexible images, media queries, and mobile-first approach. Always test across different devices and screen sizes.",
    "example": false,
    "tool_calls": [],
    "usage_metadata": null,
    "additional_kwargs": {},
    "response_metadata": {},
    "invalid_tool_calls": []
  },
  "type": "ai"
}');

INSERT INTO bd_chat_history (session_id, message) VALUES 
('123e4567-e89b-12d3-a456-426614174002', '{
  "data": {
    "id": "01JX749S036KJ8AXTB4GH1DY60",
    "name": "Human",
    "type": "human",
    "content": "What are the main components of cloud architecture?",
    "example": false,
    "tool_calls": [],
    "usage_metadata": null,
    "additional_kwargs": {},
    "response_metadata": {},
    "invalid_tool_calls": []
  },
  "type": "human"
}');

INSERT INTO bd_chat_history (session_id, message) VALUES 
('123e4567-e89b-12d3-a456-426614174002', '{
  "data": {
    "id": "01JX749S036KJ8AXTB4GH1DY61",
    "name": "Assistant",
    "type": "ai",
    "content": "Cloud architecture typically includes front-end platforms, back-end platforms, cloud-based delivery, and a network. It also involves components like load balancers, databases, and storage systems.",
    "example": false,
    "tool_calls": [],
    "usage_metadata": null,
    "additional_kwargs": {},
    "response_metadata": {},
    "invalid_tool_calls": []
  },
  "type": "ai"
}');

