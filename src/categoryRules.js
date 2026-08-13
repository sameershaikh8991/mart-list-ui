const CATEGORY_RULES = [
  // 🥛 Dairy
  [
    [
      "milk", "doodh", "curd", "dahi", "paneer", "cheese", "yogurt",
      "yoghurt", "butter", "cream", "malai", "buttermilk", "chaas",
      "lassi", "ghee", "khoa", "khoya"
    ],
    "Dairy"
  ],

  // 🥤 Beverages
  [
    [
      "tea", "chai", "coffee", "juice", "cola", "soda", "drink",
      "pepsi", "coke", "sprite", "fanta", "maaza", "slice", "appy",
      "energy drink", "soft drink", "green tea", "black tea"
    ],
    "Beverages"
  ],

  // 🌾 Grains & Pulses
  [
    [
      "rice", "chawal", "basmati", "atta", "flour", "maida",
      "rava", "suji", "sooji", "dal", "daal", "lentil", "moong",
      "masoor", "toor", "tuvar", "urad", "chana dal", "wheat",
      "gehun", "besan", "gram flour", "poha", "sabudana", "millet",
      "bajra", "jowar", "ragi", "quinoa"
    ],
    "Grains & Pulses"
  ],

  // 🫒 Oil & Ghee
  [
    [
      "oil", "ghee", "cooking oil", "sunflower oil", "mustard oil",
      "coconut oil", "groundnut oil", "olive oil", "rice bran oil",
      "sesame oil", "til oil"
    ],
    "Oil & Ghee"
  ],

  // 🌶️ Spices & Masala
  [
    [
      "masala", "spice", "salt", "namak", "chilli", "chili",
      "mirchi", "turmeric", "haldi", "jeera", "cumin", "dhaniya",
      "coriander", "pepper", "black pepper", "garam masala",
      "chaat masala", "kitchen king", "elaichi", "cardamom",
      "dalchini", "cinnamon", "laung", "clove", "tej patta",
      "ajwain", "methi", "hing", "asafoetida", "mustard seeds",
      "rai", "saunf", "fennel", "kasuri methi"
    ],
    "Spices & Masala"
  ],

  // 🍞 Bakery
  [
    [
      "bread", "bun", "cake", "pastry", "pav", "croissant",
      "muffin", "rusk", "toast", "khari", "donut", "doughnut"
    ],
    "Bakery"
  ],

  // 🍪 Snacks
  [
    [
      "biscuit", "biscuit", "cookie", "chips", "namkeen", "snack",
      "kurkure", "bhujia", "sev", "mixture", "popcorn", "nachos",
      "wafers", "chakli", "mathri", "peanuts", "nuts", "almond",
      "badam", "cashew", "kaju", "pistachio", "pista", "walnut",
      "akhrot"
    ],
    "Snacks"
  ],

  // 🍎 Fruits
  [
    [
      "apple", "banana", "mango", "orange", "grape", "fruit",
      "papaya", "guava", "watermelon", "melon", "pineapple",
      "pomegranate", "anar", "kiwi", "pear", "strawberry",
      "cherry", "lemon", "lime", "coconut"
    ],
    "Fruits"
  ],

  // 🥦 Vegetables
  [
    [
      "onion", "pyaz", "potato", "aloo", "tomato", "vegetable",
      "veggie", "carrot", "spinach", "palak", "cabbage", "cauliflower",
      "gobi", "brinjal", "baingan", "capsicum", "pepper",
      "peas", "matar", "beans", "ladyfinger", "bhindi",
      "cucumber", "kheera", "beetroot", "radish", "mooli",
      "ginger", "adrak", "garlic", "lehsun", "broccoli",
      "bottle gourd", "lauki", "pumpkin", "kaddu", "okra"
    ],
    "Vegetables"
  ],

  // 🧴 Personal Care
  [
    [
      "soap", "shampoo", "conditioner", "toothpaste", "toothbrush",
      "mouthwash", "lotion", "moisturizer", "cream", "deodorant",
      "perfume", "razor", "shaving", "shaving cream", "face wash",
      "facewash", "sunscreen", "sani pad", "sanitary pad",
      "tampon", "comb", "hair oil", "body wash", "handwash",
      "hand wash", "lip balm", "talcum", "powder"
    ],
    "Personal Care"
  ],

  // 🧹 Cleaning
  [
    [
      "detergent", "surf", "washing powder", "washing liquid",
      "cleaner", "phenyl", "dishwash", "dish wash", "dishwasher",
      "harpic", "toilet cleaner", "floor cleaner", "glass cleaner",
      "toilet brush", "scrub", "sponge", "broom", "mop",
      "dustpan", "bleach", "disinfectant", "sanitizer",
      "fabric softener", "vim"
    ],
    "Cleaning"
  ],

  // 👶 Baby Care
  [
    [
      "diaper", "nappy", "baby", "baby food", "baby powder",
      "baby soap", "baby shampoo", "baby lotion", "baby wipes",
      "wipes", "feeding bottle", "baby bottle", "formula"
    ],
    "Baby Care"
  ],

  // 🐶 Pet Care
  [
    [
      "pet", "dog food", "cat food", "puppy food", "kitten food",
      "dog treats", "cat treats", "pet food", "pet shampoo",
      "cat litter", "litter"
    ],
    "Pet Care"
  ],

  // ❄️ Frozen Food
  [
    [
      "frozen", "frozen peas", "frozen corn", "frozen vegetables",
      "frozen chicken", "frozen fries", "frozen paratha",
      "frozen samosa", "frozen nuggets"
    ],
    "Frozen Food"
  ],

  // 🥣 Breakfast
  [
    [
      "cereal", "oats", "muesli", "cornflakes", "granola",
      "porridge", "breakfast", "honey", "jam", "peanut butter",
      "spread"
    ],
    "Breakfast"
  ],

  // 🍳 Kitchen Essentials
  [
    [
      "egg", "eggs", "sugar", "shakkar", "jaggery", "gud",
      "vinegar", "baking soda", "baking powder", "yeast",
      "vanilla essence", "food color", "cooking spray"
    ],
    "Kitchen"
  ],

  // 🍗 Meat & Seafood
  [
    [
      "chicken", "mutton", "meat", "fish", "prawns", "prawn",
      "shrimp", "seafood", "beef", "lamb", "chicken breast",
      "chicken wings", "chicken leg", "keema", "mince",
      "sausage", "salami"
    ],
    "Meat & Seafood"
  ],

  // 🥫 Packaged & Canned Food
  [
    [
      "maggi", "noodles", "pasta", "macaroni", "spaghetti",
      "soup", "sauce", "ketchup", "tomato sauce", "mayonnaise",
      "mayo", "pickle", "achar", "canned", "tin", "ready to eat",
      "instant food"
    ],
    "Packaged Food"
  ],

  // 🍫 Sweets & Chocolates
  [
    [
      "chocolate", "chocolates", "candy", "toffee", "sweet",
      "mithai", "gulab jamun", "rasgulla", "barfi", "laddu",
      "ladoo", "ice cream", "kulfi"
    ],
    "Sweets & Desserts"
  ],

  // 🧺 Household
  [
    [
      "tissue", "tissues", "toilet paper", "paper towel",
      "aluminium foil", "foil", "cling wrap", "plastic wrap",
      "garbage bag", "trash bag", "zip lock", "storage bag",
      "matchbox", "matches", "candle", "battery"
    ],
    "Household"
  ],

  // 📚 Stationery
  [
    [
      "pen", "pencil", "notebook", "book", "paper", "marker",
      "eraser", "sharpener", "scale", "ruler", "glue",
      "tape", "stapler", "staples"
    ],
    "Stationery"
  ],
];
