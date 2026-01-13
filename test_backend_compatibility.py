"""Quick test to verify backend returns data in format frontend expects"""
from backend import app
import json

with app.test_client() as client:
    # Test filters endpoint
    print("=" * 60)
    print("Testing /api/filters/dimensions")
    print("=" * 60)
    r = client.get('/api/filters/dimensions')
    data = json.loads(r.data)
    print(f"Teams: {len(data.get('teams', []))}")
    print(f"Regions: {len(data.get('regions', []))}")
    print(f"Channels: {len(data.get('channels', []))}")
    if data.get('teams'):
        print(f"Sample team: {data['teams'][0]}")
    
    # Test issues endpoint
    print("\n" + "=" * 60)
    print("Testing /api/field-signal/issues")
    print("=" * 60)
    r = client.get('/api/field-signal/issues?time_range=30')
    data = json.loads(r.data)
    issues = data.get('data', [])
    print(f"Issues returned: {len(issues)}")
    if issues:
        issue = issues[0]
        print(f"Sample issue keys: {list(issue.keys())}")
        print(f"Has issue_id: {'issue_id' in issue}")
        print(f"Has issue_name: {'issue_name' in issue}")
        print(f"Has severity_score: {'severity_score' in issue}")
    
    # Test teams endpoint
    print("\n" + "=" * 60)
    print("Testing /api/field-ops/teams")
    print("=" * 60)
    r = client.get('/api/field-ops/teams?time_range=30')
    data = json.loads(r.data)
    teams = data.get('data', [])
    print(f"Teams returned: {len(teams)}")
    if teams:
        team = teams[0]
        print(f"Sample team keys: {list(team.keys())}")
        print(f"Has team_id: {'team_id' in team}")
        print(f"Has team_name: {'team_name' in team}")
    
    print("\n" + "=" * 60)
    print("✅ Backend compatibility test complete")
    print("=" * 60)

