import requests
import sys

API_BASE = "http://127.0.0.1:8000/api/v1"

def run_tests():
    print("--- 1. Testing GET Categories and Products initially ---")
    cats = requests.get(f"{API_BASE}/categories/").json()
    prods = requests.get(f"{API_BASE}/products/").json()
    print(f"Current DB Categories: {len(cats)}")
    print(f"Current DB Products: {len(prods)}")

    print("\n--- 2. Creating Categories ---")
    cat1_res = requests.post(f"{API_BASE}/categories/", json={
        "name": "Kashmir Willow Special",
        "description": "Finest Grade 1 Kashmir Willow Bats",
        "display_order": 1,
        "banner_image": "/assets/poster.jpg"
    })
    assert cat1_res.status_code == 200, f"Failed cat1: {cat1_res.text}"
    cat1 = cat1_res.json()
    print(f"Created Cat 1: {cat1['name']} (ID: {cat1['id']}, Slug: {cat1['slug']})")

    cat2_res = requests.post(f"{API_BASE}/categories/", json={
        "name": "English Willow Limited",
        "description": "Pro player grade English Willow Bats",
        "display_order": 2,
        "banner_image": "/assets/poster.jpg"
    })
    assert cat2_res.status_code == 200, f"Failed cat2: {cat2_res.text}"
    cat2 = cat2_res.json()
    print(f"Created Cat 2: {cat2['name']} (ID: {cat2['id']}, Slug: {cat2['slug']})")

    print("\n--- 3. Creating Products linked to Category ID ---")
    prod1_res = requests.post(f"{API_BASE}/products/", json={
        "name": "VKKK Master Punch Bat",
        "category_id": cat1["id"],
        "price": 2899.0,
        "compare_price": 4500.0,
        "stock": 55,
        "grade": "Grade 1 Kashmir Willow",
        "pressing": "Hand Pressed",
        "is_featured": True,
        "is_bestseller": True,
        "images": ["/assets/bat_single.png"],
        "specs": {"handle": "Full Cane", "edges": "41mm", "spine": "65mm", "sweetspot": "Mid-Low"},
        "variants": {"weights": ["1160g", "1180g"], "handles": ["Round", "Oval"]}
    })
    assert prod1_res.status_code == 200, f"Failed prod1: {prod1_res.text}"
    prod1 = prod1_res.json()
    print(f"Created Prod 1: {prod1['name']} (ID: {prod1['id']}, Category ID: {prod1['category_id']})")

    prod2_res = requests.post(f"{API_BASE}/products/", json={
        "name": "VK Limited Edition Player Bat",
        "category_id": cat2["id"],
        "price": 14999.0,
        "compare_price": 22000.0,
        "stock": 10,
        "grade": "Grade 1 English Willow",
        "pressing": "Triple Pressed",
        "is_featured": True,
        "is_bestseller": False,
        "images": ["/assets/bat_double.png"]
    })
    assert prod2_res.status_code == 200, f"Failed prod2: {prod2_res.text}"
    prod2 = prod2_res.json()
    print(f"Created Prod 2: {prod2['name']} (ID: {prod2['id']}, Category ID: {prod2['category_id']})")

    print("\n--- 4. Testing Category Filtering at SQL level ---")
    cat1_prods = requests.get(f"{API_BASE}/products/?category_id={cat1['id']}").json()
    print(f"Products under Cat 1 ({cat1['name']}): {[p['name'] for p in cat1_prods]}")
    assert len(cat1_prods) == 1 and cat1_prods[0]["id"] == prod1["id"]

    cat2_prods = requests.get(f"{API_BASE}/products/?category_id={cat2['id']}").json()
    print(f"Products under Cat 2 ({cat2['name']}): {[p['name'] for p in cat2_prods]}")
    assert len(cat2_prods) == 1 and cat2_prods[0]["id"] == prod2["id"]

    print("\n--- 5. Testing Category Delete Protection (Should fail because products exist) ---")
    del_cat_res = requests.delete(f"{API_BASE}/categories/{cat1['id']}")
    print(f"Delete Cat with products response status: {del_cat_res.status_code} ({del_cat_res.text})")
    assert del_cat_res.status_code == 400

    print("\n--- 6. Updating Product ---")
    update_res = requests.put(f"{API_BASE}/products/{prod1['id']}", json={
        "name": "VKKK Master Punch Bat (Updated)",
        "category_id": cat1["id"],
        "price": 3199.0,
        "stock": 50
    })
    assert update_res.status_code == 200, f"Update failed: {update_res.text}"
    updated = update_res.json()
    print(f"Updated product price to: INR {updated['price']}, stock to: {updated['stock']}")

    print("\n==========================================")
    print(" ALL WORKFLOW TESTS PASSED PERFECTLY! ")
    print("==========================================")

if __name__ == "__main__":
    run_tests()
