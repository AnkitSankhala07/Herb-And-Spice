export const MENU_ITEMS = [
    {
        id: 1,
        name: "Classic Burger",
        price: 12.99,
        category: "Mains",
        image: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=500&q=80",
        description: "Juicy beef patty with cheddar cheese, lettuce, and tomato.",
        isVeg: false,
        isTrending: true,
        calories: 850,
        prepTime: 15
    },
    {
        id: 2,
        name: "Margherita Pizza",
        price: 14.50,
        category: "Mains",
        image: "https://images.unsplash.com/photo-1604382354936-07c5d9983bd3?w=500&q=80",
        description: "Traditional tomato sauce, mozzarella, and basil.",
        isVeg: true,
        isPopular: true,
        calories: 700,
        prepTime: 20
    },
    {
        id: 3,
        name: "Caesar Salad",
        price: 9.99,
        category: "Starters",
        image: "https://images.unsplash.com/photo-1550304943-4f24f54ddde9?w=500&q=80",
        description: "Crisp romaine, parmesan, croutons, and caesar dressing.",
        isVeg: true,
        isHealthy: true,
        calories: 320,
        prepTime: 8
    },
    {
        id: 4,
        name: "Chocolate Lava Cake",
        price: 6.99,
        category: "Dessert",
        image: "https://images.unsplash.com/photo-1624353365286-3f8d62daad51?w=500&q=80",
        description: "Warm chocolate cake with a molten center.",
        isVeg: true,
        calories: 450,
        prepTime: 10
    },
    {
        id: 5,
        name: "Iced Latte",
        price: 4.50,
        category: "Drinks",
        image: "https://images.unsplash.com/photo-1517701604599-bb29b5aa611b?w=500&q=80",
        description: "Espresso with cold milk and ice.",
        isVeg: true,
        calories: 120,
        prepTime: 5
    }
];

export const CATEGORIES = ["All", "Starters", "Mains", "Dessert", "Drinks"];
