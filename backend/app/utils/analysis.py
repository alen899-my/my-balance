import re

def classify_category(payee):
    if not payee: return "Personal"
    payee = payee.upper()
    categories = {
        "Health & Fitness": ["GYM", "FITNESS", "WORKOUT", "CROSSFIT", "YOGA", "PROTEIN"],
        "Automotive": ["REPAIR", "SERVICE", "GARAGE", "MOTORS", "HONDA", "SUZUKI", "TYRE", "WASH", "SPARE"],
        "Bills & Utilities": ["KERALAVISION", "KSEB", "ELECTRIC", "WATER", "BROADBAND", "RECHARGE", "AIRTEL", "VI", "JIO"],
        "Entertainment/Gaming": ["DREAM11", "MY11CIRCLE", "NETFLIX", "SPOTIFY", "STEAM", "HOTSTAR", "GAMES"],
        "Food & Dining": ["ZOMATO", "SWIGGY", "RESTAURANT", "HOTEL", "CAFE", "BAKES", "TEA", "COFFEE"],
        "Shopping": ["AMAZON", "FLIPKART", "MYNTRA", "RETAIL", "SUPERMARKET", "GROCERY"],
        "Medical": ["HOSPITAL", "PHARMACY", "CLINIC", "LAB", "MED", "DOCTOR", "DENTAL"],
        "Transport/Fuel": ["PETROL", "SHELL", "CNG", "UBER", "OLA", "METRO", "RAILWAY"]
    }
    for category, keywords in categories.items():
        if any(key in payee for key in keywords):
            return category
    return "Personal"

def extract_clean_name(text):
    if not text: return "Internal Transfer"
    match = re.search(r'/\s*([^/@\s]+)@', text)
    if match:
        return match.group(1).strip().title()
    parts = text.split('/')
    if len(parts) > 2:
        return parts[2].strip().title()
    return text[:15].strip().title()
