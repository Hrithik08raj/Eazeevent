import pytest


def test_ai_chat_local_fallback_vendor_search(client, test_vendor):
    """AI concierge local fallback returns matching vendors when Gemini key absent."""
    res = client.post("/api/ai/chat", json={
        "message": "Find photographers in Mumbai",
        "customer_email": None,
    })
    assert res.status_code == 200
    reply = res.json()["reply"]
    # The fallback search should find the seeded "Lumiere Photo Studio" (Photography, Mumbai)
    assert "Lumiere Photo Studio" in reply or "photography" in reply.lower()


def test_ai_chat_default_fallback_no_match(client):
    """AI concierge returns the default helper message when no vendor matches."""
    res = client.post("/api/ai/chat", json={
        "message": "Tell me a joke",
    })
    assert res.status_code == 200
    data = res.json()
    assert "reply" in data
    assert len(data["reply"]) > 0


def test_ai_generate_caption_fallback(client):
    """Caption generator returns a non-empty caption string via fallback template."""
    res = client.post("/api/ai/generate-caption", json={
        "prompt": "Outdoor garden wedding with fairy lights",
        "tone": "Romantic & Elegant",
    })
    assert res.status_code == 200
    caption = res.json()["caption"]
    assert len(caption) > 10
    # Fallback templates include a hashtag
    assert "#" in caption


def test_ai_caption_different_tone(client):
    """Caption generator supports multiple tones."""
    res = client.post("/api/ai/generate-caption", json={
        "prompt": "Rooftop birthday party",
        "tone": "Fun & Playful",
    })
    assert res.status_code == 200
    assert len(res.json()["caption"]) > 10


def test_ai_vendor_matchmaker(client, test_customer, test_vendor):
    """Matchmaker returns ranked vendor recommendations for a logged-in customer."""
    res = client.get("/api/ai/match-vendors", headers=test_customer["headers"])
    assert res.status_code == 200
    matches = res.json()
    assert isinstance(matches, list)
    # Must return at least the seeded vendor
    assert len(matches) >= 1
    for m in matches:
        assert "business_name" in m
        assert "match_percentage" in m
        assert 0 <= m["match_percentage"] <= 100


def test_ai_matchmaker_requires_customer_auth(client, test_vendor, admin_headers):
    """Matchmaker is restricted to customers only."""
    # Vendor token should be rejected
    res = client.get("/api/ai/match-vendors", headers=test_vendor["headers"])
    assert res.status_code == 403

    # No token at all
    res2 = client.get("/api/ai/match-vendors")
    assert res2.status_code in (401, 403)
