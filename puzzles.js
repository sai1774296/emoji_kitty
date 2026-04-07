const puzzles = [
  // Telugu Movies
  { emojis: "💪 🐘 👑", category: "Telugu Movie", answers: ["baahubali", "bahubali", "baahubali 2"], hint: "A warrior prince fights for his throne" },
  { emojis: "🔥 💧 🏴", category: "Telugu Movie", answers: ["rrr"], hint: "Two rebels fight against oppression" },
  { emojis: "🌺 🪵 🏔️", category: "Telugu Movie", answers: ["pushpa"], hint: "A smuggler rises in the red sanders trade" },
  { emojis: "🏥 ❤️ 🍺", category: "Telugu Movie", answers: ["arjun reddy"], hint: "A surgeon's downfall through love and loss" },
  { emojis: "👨‍👦 🏠 💃", category: "Telugu Movie", answers: ["ala vaikunthapurramuloo", "ala vaikunthapurramloo"], hint: "A son returns home to help his father" },
  { emojis: "🪰 💀 ❤️", category: "Telugu Movie", answers: ["eega"], hint: "A fly seeks revenge for love" },
  { emojis: "⚔️ 🐴 ♻️", category: "Telugu Movie", answers: ["magadheera"], hint: "Reincarnation and past life love story" },
  { emojis: "💰 🏘️ ❤️", category: "Telugu Movie", answers: ["srimanthudu"], hint: "A billionaire builds homes for the poor" },
  { emojis: "🌾 👂 🏘️", category: "Telugu Movie", answers: ["rangasthalam"], hint: "A deaf man saves his village from crime" },
  { emojis: "🏠 👴 💃", category: "Telugu Movie", answers: ["attarintiki daredi"], hint: "A girl dances to win her grandfather's love" },
  { emojis: "🤠 🔫 😎", category: "Telugu Movie", answers: ["gabbar singh"], hint: "A rogue cop with a mysterious past" },
  { emojis: "📰 🎵 ⚖️", category: "Telugu Movie", answers: ["jalsa"], hint: "A newspaper editor and a judge clash in court" },
  { emojis: "🔫 🕺 🎭", category: "Telugu Movie", answers: ["pokiri"], hint: "A young man becomes a merciless killer" },
  { emojis: "👮 😡 ⚖️", category: "Telugu Movie", answers: ["temper"], hint: "A cop's anger problems turn deadly" },
  { emojis: "🔒 💯 🕺", category: "Telugu Movie", answers: ["khaidi no 150"], hint: "A convict returns and rules the streets" },
  { emojis: "🎬 💔 🔫", category: "Telugu Movie", answers: ["bunny"], hint: "A young man becomes a cold-blooded assassin" },
  { emojis: "🏆 🎾 💪", category: "Telugu Movie", answers: ["jersey"], hint: "An aging cricketer makes his comeback" },

  // Indian Food
  { emojis: "🍚 🍗 🧅 🌶️", category: "Indian Food", answers: ["biryani", "chicken biryani", "hyderabadi biryani"], hint: "Fragrant rice cooked with meat and spices" },
  { emojis: "🫓 🥥 🌶️", category: "Indian Food", answers: ["dosa", "masala dosa"], hint: "Crispy crepe from South India" },
  { emojis: "🔺 🥔 🫒", category: "Indian Food", answers: ["samosa"], hint: "Triangular fried pastry with filling" },
  { emojis: "🟤 🍯 🌹", category: "Indian Food", answers: ["gulab jamun"], hint: "Sweet round balls soaked in syrup" },
  { emojis: "💧 ⭕ 🌶️", category: "Indian Food", answers: ["pani puri", "gol gappa", "puchka"], hint: "Crispy balls filled with spicy water and potato" },
  { emojis: "🥘 🍛 🥄", category: "Indian Food", answers: ["curry"], hint: "Spiced meat or vegetable stew" },
  { emojis: "🥒 🌶️ 🫒", category: "Indian Food", answers: ["achaar", "pickle"], hint: "Spicy preserved vegetables" },
  { emojis: "🤲 🍛 🧈", category: "Indian Food", answers: ["butter chicken"], hint: "Creamy tomato-based chicken dish" },
  { emojis: "🟫 🍯 🤔", category: "Indian Food", answers: ["jalebi"], hint: "Orange spiral sweet soaked in syrup" },
  { emojis: "🍲 🧅 🥒", category: "Indian Food", answers: ["rasam"], hint: "Spicy tangy soup from South India" },
  { emojis: "🥙 🧅 🍅", category: "Indian Food", answers: ["pav bhaji"], hint: "Spiced vegetable curry with bread rolls" },
  { emojis: "🫓 🥘 🧈", category: "Indian Food", answers: ["paneer tikka"], hint: "Grilled cottage cheese marinated in spices" },
  { emojis: "🥣 🍚 🧈", category: "Indian Food", answers: ["khichdi"], hint: "Comfort rice and lentil dish" },
  { emojis: "🍞 🧈 🌶️", category: "Indian Food", answers: ["naan"], hint: "Fluffy flatbread from tandoor" },
  { emojis: "🍜 🥖 🥬", category: "Indian Food", answers: ["idli"], hint: "Steamed rice cake from South India" },
  { emojis: "🫓 🥔 🌶️", category: "Indian Food", answers: ["vada"], hint: "Fried lentil donut from South India" },
  { emojis: "☕ 🥛 🍵", category: "Indian Food", answers: ["chai"], hint: "Spiced tea milk beverage" },
  { emojis: "🟡 🍯 🧈", category: "Indian Food", answers: ["laddu", "ladoo"], hint: "Round sweet balls made with flour or nuts" },

  // Festivals
  { emojis: "🪔 🎆 🎁", category: "Festival", answers: ["diwali", "deepavali"], hint: "Festival of lights celebrated with fireworks" },
  { emojis: "🎨 💧 🟣🟡🟢", category: "Festival", answers: ["holi"], hint: "Festival of colors celebrated with water" },
  { emojis: "🪁 🐂 🌾", category: "Festival", answers: ["sankranti", "makar sankranti"], hint: "Harvest festival with kites and bonfires" },
  { emojis: "🐘 🙏 🎶", category: "Festival", answers: ["ganesh chaturthi", "vinayaka chaturthi"], hint: "Celebration of the elephant-headed god" },
  { emojis: "🌺 🪔 👩‍🌾", category: "Festival", answers: ["bathukamma"], hint: "Flower festival celebrated by women in Telangana" },
  { emojis: "🛕 👪 🎭", category: "Festival", answers: ["bonalu"], hint: "Offering ceremony to the goddess" },
  { emojis: "🎪 🏹 🦅", category: "Festival", answers: ["dasara", "dussehra"], hint: "Celebration of good over evil for 9 days" },
  { emojis: "🌅 🎨 🆕", category: "Festival", answers: ["ugadi", "gudi padwa"], hint: "Telugu and Marathi new year celebration" },

  // Tollywood Actors
  { emojis: "🦁 👑 💪", category: "Tollywood Actor", answers: ["pawan kalyan", "powerstar"], hint: "The powerstar of Telugu cinema" },
  { emojis: "🏛️ 👨 🎬", category: "Tollywood Actor", answers: ["mahesh babu"], hint: "The prince of Telugu cinema" },
  { emojis: "🌟 💫 🎭", category: "Tollywood Actor", answers: ["ram charan"], hint: "Known for powerful roles in big-budget films" },
  { emojis: "🎵 💔 🕺", category: "Tollywood Actor", answers: ["vijay deverakonda"], hint: "The chocolate-faced hero of Telugu cinema" },
  { emojis: "👦 😊 🎬", category: "Tollywood Actor", answers: ["nani"], hint: "Known for backing unique and interesting films" },
  { emojis: "🌙 ✨ 👸", category: "Tollywood Actress", answers: ["anushka shetty"], hint: "Famous for action and period films" },
  { emojis: "🎬 🌟 💎", category: "Tollywood Actor", answers: ["allu arjun"], hint: "Stylish star known for dancing" },

  // Famous Places
  { emojis: "4️⃣ 🏛️ 🕌", category: "Famous Place", answers: ["charminar"], hint: "Four-minaret monument in Hyderabad" },
  { emojis: "🛕 ⛰️ 🙏", category: "Famous Place", answers: ["tirupati", "tirumala"], hint: "Holy temple on a mountain with millions of pilgrims" },
  { emojis: "🏰 💧 🌉", category: "Famous Place", answers: ["golconda fort"], hint: "Ancient fort with diamond mines in Hyderabad" },
  { emojis: "🕌 ⭐ 🛕", category: "Famous Place", answers: ["mecca masjid"], hint: "Historic mosque in Hyderabad's old city" },
  { emojis: "🦚 🛕 ✨", category: "Famous Place", answers: ["falaknuma palace"], hint: "Mirror-like palace museum in Hyderabad" }
];

module.exports = puzzles;
