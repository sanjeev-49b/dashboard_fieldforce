"""
Create sample FieldForce database with example data
Run this to generate fieldforce.db with all required tables
"""

import sqlite3
from datetime import datetime, timedelta
import random

def create_database():
    # Connect to database (creates if doesn't exist)
    conn = sqlite3.connect('fieldforce.db')
    cursor = conn.cursor()
    
    print("Creating tables...")
    
    # Dimension Tables
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS dim_region (
            region_id INTEGER PRIMARY KEY,
            region_name TEXT NOT NULL,
            latitude REAL,
            longitude REAL
        )
    ''')
    
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS dim_team (
            team_id INTEGER PRIMARY KEY,
            team_name TEXT NOT NULL
        )
    ''')
    
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS dim_channel (
            channel_id INTEGER PRIMARY KEY,
            channel_name TEXT NOT NULL
        )
    ''')
    
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS dim_client_type (
            client_type_id INTEGER PRIMARY KEY,
            client_type_name TEXT NOT NULL
        )
    ''')
    
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS dim_agent (
            agent_id INTEGER PRIMARY KEY,
            agent_name TEXT NOT NULL
        )
    ''')
    
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS dim_issue (
            issue_id INTEGER PRIMARY KEY,
            issue_name TEXT NOT NULL
        )
    ''')
    
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS dim_outcome (
            outcome_id INTEGER PRIMARY KEY,
            outcome_name TEXT NOT NULL
        )
    ''')
    
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS dim_date (
            date_id INTEGER PRIMARY KEY,
            calendar_date DATE NOT NULL,
            year INTEGER,
            month INTEGER,
            day INTEGER
        )
    ''')
    
    # Fact Tables
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS fact_conversation (
            conversation_id INTEGER PRIMARY KEY AUTOINCREMENT,
            date_id INTEGER,
            region_id INTEGER,
            team_id INTEGER,
            channel_id INTEGER,
            client_type_id INTEGER,
            agent_id INTEGER,
            issue_id INTEGER,
            sentiment_score REAL,
            risk_score REAL,
            quality_score REAL,
            is_converted INTEGER,
            severity TEXT,
            FOREIGN KEY (date_id) REFERENCES dim_date(date_id),
            FOREIGN KEY (region_id) REFERENCES dim_region(region_id),
            FOREIGN KEY (team_id) REFERENCES dim_team(team_id),
            FOREIGN KEY (channel_id) REFERENCES dim_channel(channel_id),
            FOREIGN KEY (client_type_id) REFERENCES dim_client_type(client_type_id),
            FOREIGN KEY (agent_id) REFERENCES dim_agent(agent_id),
            FOREIGN KEY (issue_id) REFERENCES dim_issue(issue_id)
        )
    ''')
    
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS fact_outcome (
            outcome_event_id INTEGER PRIMARY KEY AUTOINCREMENT,
            date_id INTEGER,
            outcome_id INTEGER,
            conversation_id INTEGER,
            FOREIGN KEY (date_id) REFERENCES dim_date(date_id),
            FOREIGN KEY (outcome_id) REFERENCES dim_outcome(outcome_id),
            FOREIGN KEY (conversation_id) REFERENCES fact_conversation(conversation_id)
        )
    ''')
    
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS fact_conversation_entities (
            entity_id INTEGER PRIMARY KEY AUTOINCREMENT,
            conversation_id INTEGER,
            entity_name TEXT,
            entity_type TEXT,
            FOREIGN KEY (conversation_id) REFERENCES fact_conversation(conversation_id)
        )
    ''')
    
    print("Inserting sample data...")
    
    # Insert Regions
    regions = [
        (1, 'North Region', 28.7041, 77.1025),
        (2, 'South Region', 13.0827, 80.2707),
        (3, 'East Region', 22.5726, 88.3639),
        (4, 'West Region', 19.0760, 72.8777),
        (5, 'Central Region', 23.2599, 77.4126)
    ]
    cursor.executemany('INSERT OR IGNORE INTO dim_region VALUES (?, ?, ?, ?)', regions)
    
    # Insert Teams
    teams = [(1, 'Team Alpha'), (2, 'Team Beta'), (3, 'Team Gamma'), (4, 'Team Delta')]
    cursor.executemany('INSERT OR IGNORE INTO dim_team VALUES (?, ?)', teams)
    
    # Insert Channels
    channels = [(1, 'Phone'), (2, 'Email'), (3, 'Chat'), (4, 'In-Person')]
    cursor.executemany('INSERT OR IGNORE INTO dim_channel VALUES (?, ?)', channels)
    
    # Insert Client Types
    client_types = [(1, 'Enterprise'), (2, 'SMB'), (3, 'Individual'), (4, 'Partner')]
    cursor.executemany('INSERT OR IGNORE INTO dim_client_type VALUES (?, ?)', client_types)
    
    # Insert Agents
    agents = [
        (1, 'John Smith'), (2, 'Sarah Johnson'), (3, 'Mike Williams'),
        (4, 'Emily Brown'), (5, 'David Jones'), (6, 'Lisa Garcia')
    ]
    cursor.executemany('INSERT OR IGNORE INTO dim_agent VALUES (?, ?)', agents)
    
    # Insert Issues
    issues = [
        (1, 'Product Inquiry'), (2, 'Technical Support'), (3, 'Billing Issue'),
        (4, 'Feature Request'), (5, 'Complaint'), (6, 'Installation Help')
    ]
    cursor.executemany('INSERT OR IGNORE INTO dim_issue VALUES (?, ?)', issues)
    
    # Insert Outcomes
    outcomes = [
        (1, 'Resolved'), (2, 'Escalated'), (3, 'Pending'),
        (4, 'Converted to Sale'), (5, 'Closed')
    ]
    cursor.executemany('INSERT OR IGNORE INTO dim_outcome VALUES (?, ?)', outcomes)
    
    # Insert Dates (last 90 days)
    base_date = datetime.now() - timedelta(days=90)
    for i in range(90):
        current_date = base_date + timedelta(days=i)
        date_id = int(current_date.strftime('%Y%m%d'))
        cursor.execute('''
            INSERT OR IGNORE INTO dim_date VALUES (?, ?, ?, ?, ?)
        ''', (date_id, current_date.strftime('%Y-%m-%d'), 
              current_date.year, current_date.month, current_date.day))
    
    # Insert Sample Conversations
    print("Generating sample conversations...")
    severities = ['LOW', 'MEDIUM', 'HIGH']
    
    for i in range(500):  # 500 sample conversations
        days_ago = random.randint(0, 89)
        conv_date = base_date + timedelta(days=days_ago)
        date_id = int(conv_date.strftime('%Y%m%d'))
        
        cursor.execute('''
            INSERT INTO fact_conversation 
            (date_id, region_id, team_id, channel_id, client_type_id, agent_id, issue_id,
             sentiment_score, risk_score, quality_score, is_converted, severity)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ''', (
            date_id,
            random.randint(1, 5),  # region
            random.randint(1, 4),  # team
            random.randint(1, 4),  # channel
            random.randint(1, 4),  # client_type
            random.randint(1, 6),  # agent
            random.randint(1, 6),  # issue
            round(random.uniform(-1, 1), 2),  # sentiment_score
            round(random.uniform(0, 100), 2),  # risk_score
            round(random.uniform(0, 10), 2),  # quality_score
            random.choice([0, 0, 0, 1]),  # is_converted (25% conversion)
            random.choice(severities)  # severity
        ))
    
    # Insert Sample Outcomes
    print("Generating sample outcomes...")
    cursor.execute('SELECT conversation_id FROM fact_conversation')
    conv_ids = [row[0] for row in cursor.fetchall()]
    
    for conv_id in random.sample(conv_ids, min(300, len(conv_ids))):
        cursor.execute('SELECT date_id FROM fact_conversation WHERE conversation_id = ?', (conv_id,))
        date_id = cursor.fetchone()[0]
        
        cursor.execute('''
            INSERT INTO fact_outcome (date_id, outcome_id, conversation_id)
            VALUES (?, ?, ?)
        ''', (date_id, random.randint(1, 5), conv_id))
    
    # Insert Sample Entities
    print("Generating sample entities...")
    entity_types = ['PRODUCT', 'FEATURE', 'LOCATION', 'PERSON']
    for conv_id in random.sample(conv_ids, min(200, len(conv_ids))):
        for _ in range(random.randint(1, 3)):
            cursor.execute('''
                INSERT INTO fact_conversation_entities (conversation_id, entity_name, entity_type)
                VALUES (?, ?, ?)
            ''', (conv_id, f'Entity_{random.randint(1, 50)}', random.choice(entity_types)))
    
    conn.commit()
    conn.close()
    
    print("\n✅ Database created successfully!")
    print(f"📊 Created 'fieldforce.db' with:")
    print("   - 5 Regions")
    print("   - 4 Teams")
    print("   - 4 Channels")
    print("   - 4 Client Types")
    print("   - 6 Agents")
    print("   - 6 Issues")
    print("   - 5 Outcomes")
    print("   - 90 Days of data")
    print("   - 500 Sample conversations")
    print("   - 300 Outcomes")
    print("   - 200+ Entity mentions")
    print("\n🚀 Ready to deploy!")

if __name__ == '__main__':
    create_database()

