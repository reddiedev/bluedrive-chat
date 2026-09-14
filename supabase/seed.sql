-- Demo seed data for local/remote development.
-- Applied by `supabase db reset` (see config.toml [db.seed]) or manually via psql/MCP.

insert into public.db_sessions (id, username, title) values
    ('123e4567-e89b-12d3-a456-426614174000', 'John Doe', '🤖 Exploring AI and Machine Learning'),
    ('123e4567-e89b-12d3-a456-426614174001', 'Jane Smith', '🌐 Web Development Best Practices'),
    ('123e4567-e89b-12d3-a456-426614174002', 'Alice Johnson', '☁️ Cloud Architecture Discussion'),
    ('123e4567-e89b-12d3-a456-426614174003', 'Bob Brown', '🗄️ Database Optimization Strategies'),
    ('123e4567-e89b-12d3-a456-426614174004', 'Charlie Davis', '🔒 Cybersecurity Best Practices'),
    ('123e4567-e89b-12d3-a456-426614174005', 'Diana White', '📱 Mobile App Development Tips'),
    ('123e4567-e89b-12d3-a456-426614174006', 'Ethan Green', '⚙️ DevOps Pipeline Optimization'),
    ('123e4567-e89b-12d3-a456-426614174007', 'Fiona Black', '🎨 UI/UX Design Principles'),
    ('123e4567-e89b-12d3-a456-426614174008', 'George Blue', '🔌 API Design and Documentation'),
    ('123e4567-e89b-12d3-a456-426614174009', 'Hannah Red', '🧪 Testing and Quality Assurance')
on conflict (id) do nothing;

-- Clear any previously seeded messages so re-running the seed stays idempotent.
delete from public.bd_chat_history
where session_id in (
    '123e4567-e89b-12d3-a456-426614174000',
    '123e4567-e89b-12d3-a456-426614174001',
    '123e4567-e89b-12d3-a456-426614174002'
);

insert into public.bd_chat_history (session_id, message) values
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
    }'),
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
    }'),
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
    }'),
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
    }'),
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
    }'),
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
