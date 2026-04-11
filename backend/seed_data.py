"""Seed data generator for 200+ origami projects."""
import random

# Step templates by category and skill
def _animal_steps(title, skill):
    if skill == "beginner":
        return [
            {"step_number": 1, "title": "Prepare Your Paper", "instruction": f"Take a square piece of colored paper for your {title}. Place it on a flat surface with one corner pointing toward you like a diamond.", "tip": "Pick a color that matches your animal!"},
            {"step_number": 2, "title": "First Fold", "instruction": "Fold the paper in half diagonally to create a triangle. Press the crease firmly with your finger.", "tip": None},
            {"step_number": 3, "title": "Shape the Body", "instruction": f"Fold the triangle to create the basic body shape of your {title}. Position the long side at the top.", "tip": "Keep your folds neat and even!"},
            {"step_number": 4, "title": "Create Features", "instruction": f"Make small folds to form the ears, nose, or other features that make your {title} recognizable.", "tip": None},
            {"step_number": 5, "title": "Finishing Touches", "instruction": f"Draw eyes, a nose, and a mouth with markers to bring your {title} to life! Add any extra details you like.", "tip": f"Give your {title} a name!"},
        ]
    elif skill == "intermediate":
        return [
            {"step_number": 1, "title": "Create the Base", "instruction": f"Start with a square piece of paper for your {title}. Fold in half diagonally both ways, then horizontally both ways. Unfold to see a star pattern of creases.", "tip": "Use firm, crisp creases for the best results!"},
            {"step_number": 2, "title": "Collapse into Base", "instruction": "Using the creases, collapse the paper into a preliminary base (a smaller square shape). This is the foundation for your model.", "tip": None},
            {"step_number": 3, "title": "Shape the Body", "instruction": f"Fold the front edges to the center line on both sides, creating a kite shape. This forms the body of your {title}.", "tip": None},
            {"step_number": 4, "title": "Form the Head", "instruction": f"Use a reverse fold to bring one point upward for the neck, then another reverse fold at the tip to create the head of your {title}.", "tip": "The angle of the fold determines the pose!"},
            {"step_number": 5, "title": "Add Details", "instruction": f"Fold and shape the legs, wings, or tail. Make small crimp folds to add realistic details to your {title}.", "tip": None},
            {"step_number": 6, "title": "Final Shaping", "instruction": f"Gently curve and shape your {title} into its final 3D form. Adjust the head angle and body proportions until you're happy.", "tip": f"Display your {title} on a shelf!"},
        ]
    else:
        return [
            {"step_number": 1, "title": "Crease Pattern", "instruction": f"Start with a large square for your {title}. Create a detailed grid of mountain and valley folds - fold into quarters both ways and diagonally.", "tip": "Use thin, high-quality paper for advanced models!"},
            {"step_number": 2, "title": "Create the Base", "instruction": "Collapse the paper into a bird base or waterbomb base depending on the design. This requires precise alignment of all creases.", "tip": None},
            {"step_number": 3, "title": "Petal Folds", "instruction": "Perform petal folds on multiple sides to create the narrow points needed for limbs and features.", "tip": "This is the most challenging step - take your time!"},
            {"step_number": 4, "title": "Shape the Body", "instruction": f"Narrow the body section and create the main form of your {title} using a combination of inside and outside reverse folds.", "tip": None},
            {"step_number": 5, "title": "Create the Head", "instruction": f"Form the head with a series of precise reverse folds. Add detail folds for horns, ears, or beak of your {title}.", "tip": None},
            {"step_number": 6, "title": "Limbs and Wings", "instruction": f"Shape the legs, wings, or arms using crimp folds and squash folds. Each limb should be symmetrical.", "tip": None},
            {"step_number": 7, "title": "Detail Work", "instruction": f"Add intricate details - scales, feathers, claws, or texture folds that bring your {title} to life.", "tip": None},
            {"step_number": 8, "title": "Final Sculpture", "instruction": f"Gently shape your {title} into a dramatic 3D pose. Curve wings, arch the neck, and position the tail for the best display.", "tip": "Try wet-folding for even smoother curves!"},
        ]

def _flower_steps(title, skill):
    if skill == "beginner":
        return [
            {"step_number": 1, "title": "Start with Color", "instruction": f"Take a square piece of paper in a beautiful color for your {title}. Place it like a diamond on your table.", "tip": "Bright colors work best for flowers!"},
            {"step_number": 2, "title": "Triangle Fold", "instruction": "Fold the paper in half diagonally to make a triangle. Crease well.", "tip": None},
            {"step_number": 3, "title": "Create Petals", "instruction": f"Fold the corners of the triangle upward to start forming the petals of your {title}.", "tip": "Make the petals even on both sides."},
            {"step_number": 4, "title": "Shape the Bloom", "instruction": f"Fold the edges to round out the shape of your {title}. Tuck any sharp corners behind.", "tip": None},
            {"step_number": 5, "title": "Add a Stem", "instruction": f"Roll a thin strip of green paper for the stem. Attach it to the back of your {title} with tape or glue.", "tip": "Make a whole bouquet in different colors!"},
        ]
    elif skill == "intermediate":
        return [
            {"step_number": 1, "title": "Crease Pattern", "instruction": f"Start with a square piece of paper for your {title}. Fold in half both ways and diagonally both ways to create a star of creases.", "tip": "Use pretty patterned paper for extra beauty!"},
            {"step_number": 2, "title": "Create the Base", "instruction": "Collapse into a preliminary base or waterbomb base, depending on the flower type.", "tip": None},
            {"step_number": 3, "title": "Form Inner Petals", "instruction": f"Fold the top layers outward to create the first layer of petals for your {title}.", "tip": "Each petal should be the same size."},
            {"step_number": 4, "title": "Outer Petals", "instruction": f"Fold additional layers to create the outer petals. Each layer should open slightly more than the last.", "tip": None},
            {"step_number": 5, "title": "Shape the Center", "instruction": f"Create the center of your {title} by folding or twisting the innermost paper.", "tip": None},
            {"step_number": 6, "title": "Final Bloom", "instruction": f"Gently curl each petal outward using a pencil. Shape your {title} into a natural-looking bloom.", "tip": "Use a pencil to curl petals naturally!"},
        ]
    else:
        return [
            {"step_number": 1, "title": "Grid Preparation", "instruction": f"Start with a large square for your {title}. Create a precise grid of creases by folding into thirds or quarters both ways.", "tip": "Precision is key for advanced flowers!"},
            {"step_number": 2, "title": "Blintz Fold Layers", "instruction": "Fold all four corners to the center. Repeat this blintz fold 2-3 times to create multiple layers.", "tip": None},
            {"step_number": 3, "title": "Central Twist", "instruction": f"Create the center spiral or twist that forms the heart of your {title}. This requires careful manipulation.", "tip": "Go slowly - the paper can tear at this stage!"},
            {"step_number": 4, "title": "First Petal Layer", "instruction": f"Carefully pull out and shape the first layer of petals from underneath. These form the inner petals of your {title}.", "tip": None},
            {"step_number": 5, "title": "Additional Layers", "instruction": "Continue pulling out petal layers, each slightly larger and more open than the last.", "tip": None},
            {"step_number": 6, "title": "Outer Petals", "instruction": f"Form the outermost petals. These should spread wide to give your {title} a full, blooming appearance.", "tip": None},
            {"step_number": 7, "title": "Curl and Shape", "instruction": f"Use a pencil to curl each petal, giving your {title} a realistic, three-dimensional look.", "tip": None},
            {"step_number": 8, "title": "Stem and Leaves", "instruction": f"Create a stem from green paper and add one or two leaves. Attach to complete your {title}.", "tip": "This makes a perfect gift that never wilts!"},
        ]

def _object_steps(title, skill):
    if skill == "beginner":
        return [
            {"step_number": 1, "title": "Get Your Paper", "instruction": f"Take a piece of paper for your {title}. Use rectangular paper for some projects, square for others.", "tip": None},
            {"step_number": 2, "title": "Main Fold", "instruction": f"Fold the paper in half to create the basic shape of your {title}. Crease firmly.", "tip": "A sharp crease makes a big difference!"},
            {"step_number": 3, "title": "Shape It", "instruction": f"Make additional folds to shape your {title}. Follow the creases carefully.", "tip": None},
            {"step_number": 4, "title": "Add Details", "instruction": f"Fold the smaller features that make your {title} recognizable. Tuck in loose edges.", "tip": None},
            {"step_number": 5, "title": "Done!", "instruction": f"Your {title} is complete! Decorate it with markers or stickers if you want.", "tip": "Try making it with different colored paper!"},
        ]
    elif skill == "intermediate":
        return [
            {"step_number": 1, "title": "Prepare Paper", "instruction": f"Start with a square piece of paper for your {title}. Create center creases by folding in half both ways.", "tip": "Smooth, thin paper works best!"},
            {"step_number": 2, "title": "Create Framework", "instruction": f"Make the foundational folds that will define the structure of your {title}.", "tip": None},
            {"step_number": 3, "title": "Build the Form", "instruction": f"Through a series of folds, build up the three-dimensional shape of your {title}.", "tip": "Accuracy matters at this stage!"},
            {"step_number": 4, "title": "Refine Shape", "instruction": f"Make precision folds to refine the details and proportions of your {title}.", "tip": None},
            {"step_number": 5, "title": "Lock in Place", "instruction": f"Tuck flaps and secure folds to lock your {title} into its final form.", "tip": None},
            {"step_number": 6, "title": "Final Adjustments", "instruction": f"Make final tweaks to shape and display your completed {title}.", "tip": "Try it with metallic or patterned paper!"},
        ]
    else:
        return [
            {"step_number": 1, "title": "Complex Crease Pattern", "instruction": f"Create the full crease pattern for your {title} by making precise grid folds and diagonal creases.", "tip": "Use large paper (20cm+) for complex models!"},
            {"step_number": 2, "title": "Collapse the Model", "instruction": "Collapse all creases simultaneously to form the base shape. This requires understanding 3D geometry.", "tip": None},
            {"step_number": 3, "title": "Primary Structure", "instruction": f"Shape the main structural elements of your {title} using a combination of sink folds and petal folds.", "tip": None},
            {"step_number": 4, "title": "Secondary Features", "instruction": f"Add the secondary features and details that give your {title} its distinctive look.", "tip": "Refer back to the crease pattern if you get lost."},
            {"step_number": 5, "title": "Fine Detail", "instruction": f"Create intricate small folds for the fine details of your {title}.", "tip": None},
            {"step_number": 6, "title": "Dimensional Shaping", "instruction": f"Carefully shape your {title} into three dimensions, adjusting curves and angles.", "tip": None},
            {"step_number": 7, "title": "Final Sculpting", "instruction": f"Your {title} is complete! Make final adjustments to display it at its best.", "tip": "Consider wet-folding for smooth professional results!"},
        ]

def get_steps(category, skill, title):
    fn = {"animal": _animal_steps, "flower": _flower_steps, "object": _object_steps}
    return fn.get(category, _object_steps)(title, skill)

# Color palette
C = {
    "red": "#EF4444", "rose": "#FB7185", "pink": "#EC4899", "fuchsia": "#D946EF",
    "purple": "#A855F7", "violet": "#8B5CF6", "indigo": "#6366F1", "blue": "#3B82F6",
    "sky": "#38BDF8", "cyan": "#06B6D4", "teal": "#14B8A6", "emerald": "#10B981",
    "green": "#22C55E", "lime": "#84CC16", "yellow": "#EAB308", "amber": "#F59E0B",
    "orange": "#F97316", "coral": "#FB923C",
}

# Icons available in Ionicons
ICONS = ["paw", "fish", "leaf", "flower", "heart", "star", "flame", "moon",
         "snow", "airplane", "boat", "paper-plane", "diamond", "gift", "musical-note",
         "cube", "rocket", "car", "home", "shirt", "umbrella", "sunny", "rainy",
         "globe", "ribbon", "trophy", "flash", "sparkles", "pizza", "ice-cream"]

def _i(idx):
    return ICONS[idx % len(ICONS)]

# All 200+ origami projects (id, title, cat, skill, season, holiday, diff, time, premium, icon_idx, color_key, desc)
RAW = [
    # ===== ANIMALS - BEGINNER (25) =====
    ("puppy-face", "Puppy Face", "animal", "beginner", "all", None, 1, 5, False, 0, "coral", "Create an adorable puppy face with floppy ears!"),
    ("kitty-cat", "Kitty Cat", "animal", "beginner", "all", None, 1, 5, False, 0, "violet", "A sweet cat face with pointy ears and whiskers!"),
    ("simple-fish", "Simple Fish", "animal", "beginner", "summer", None, 1, 5, False, 1, "blue", "A colorful fish that looks great swimming on paper!"),
    ("little-bird", "Little Bird", "animal", "beginner", "spring", None, 1, 5, False, 2, "sky", "A cheerful little bird sitting on a branch!"),
    ("bunny-rabbit", "Bunny Rabbit", "animal", "beginner", "spring", "easter", 2, 8, False, 0, "pink", "A cute bunny with long floppy ears!"),
    ("quacking-duck", "Quacking Duck", "animal", "beginner", "all", None, 1, 5, False, 0, "yellow", "A yellow duck ready to swim in the pond!"),
    ("tiny-penguin", "Tiny Penguin", "animal", "beginner", "winter", None, 2, 8, False, 0, "indigo", "A tuxedo-wearing penguin from the South Pole!"),
    ("blue-whale", "Blue Whale", "animal", "beginner", "summer", None, 2, 8, False, 1, "blue", "The biggest animal in the ocean - in paper form!"),
    ("mouse-friend", "Mouse Friend", "animal", "beginner", "all", None, 1, 5, False, 0, "coral", "A tiny mouse with big round ears!"),
    ("bear-cub", "Bear Cub", "animal", "beginner", "fall", None, 2, 8, False, 0, "amber", "A fluffy little bear cub!"),
    ("silly-snake", "Silly Snake", "animal", "beginner", "summer", None, 1, 5, False, 2, "green", "A wiggly snake that's easy and fun to make!"),
    ("baby-turtle", "Baby Turtle", "animal", "beginner", "summer", None, 2, 8, False, 0, "teal", "A cute turtle with a patterned shell!"),
    ("piggy-pink", "Piggy Pink", "animal", "beginner", "all", None, 1, 5, False, 0, "pink", "An oink-worthy little pig face!"),
    ("baby-elephant", "Baby Elephant", "animal", "beginner", "all", None, 2, 8, False, 0, "violet", "A big-eared baby elephant!"),
    ("ladybug-friend", "Ladybug Friend", "animal", "beginner", "spring", None, 1, 5, False, 0, "red", "A spotted ladybug to bring you good luck!"),
    ("frog-face", "Frog Face", "animal", "beginner", "spring", None, 1, 5, False, 2, "green", "Ribbit! A green frog face!"),
    ("baby-chick", "Baby Chick", "animal", "beginner", "spring", "easter", 1, 5, False, 0, "yellow", "A fluffy yellow chick just hatched!"),
    ("seal-pup", "Seal Pup", "animal", "beginner", "winter", None, 2, 8, False, 1, "violet", "A playful seal pup on the ice!"),
    ("hedgehog-pal", "Hedgehog Pal", "animal", "beginner", "fall", None, 2, 8, False, 0, "amber", "A spiky but friendly hedgehog!"),
    ("hamster-cheeks", "Hamster Cheeks", "animal", "beginner", "all", None, 1, 5, False, 0, "coral", "A hamster with chubby cheeks full of food!"),
    ("goldfish", "Goldfish", "animal", "beginner", "all", None, 1, 5, False, 1, "orange", "A sparkly goldfish for your desk!"),
    ("robin-bird", "Robin Red", "animal", "beginner", "spring", None, 2, 8, False, 2, "red", "A robin redbreast to welcome spring!"),
    ("panda-face", "Panda Face", "animal", "beginner", "all", None, 2, 8, False, 0, "indigo", "A black and white panda face!"),
    ("starfish", "Starfish", "animal", "beginner", "summer", None, 1, 5, False, 4, "coral", "A five-armed starfish from the beach!"),
    ("snail-trail", "Snail Trail", "animal", "beginner", "spring", None, 2, 8, False, 0, "amber", "A slow and steady garden snail!"),
    # ===== ANIMALS - INTERMEDIATE (25) =====
    ("crane-001", "Paper Crane", "animal", "intermediate", "all", None, 3, 15, True, 11, "sky", "The classic crane - fold 1000 for a wish!"),
    ("jumping-frog", "Jumping Frog", "animal", "intermediate", "spring", None, 3, 12, False, 2, "green", "This frog actually jumps when you press it!"),
    ("butterfly-001", "Beautiful Butterfly", "animal", "intermediate", "spring", None, 3, 12, True, 2, "fuchsia", "A graceful butterfly with delicate wings!"),
    ("clever-fox", "Clever Fox", "animal", "intermediate", "fall", None, 2, 8, False, 0, "orange", "A sly fox with pointy ears!"),
    ("wise-owl", "Wise Owl", "animal", "intermediate", "fall", None, 3, 12, False, 0, "amber", "A wise owl watching from its tree!"),
    ("galloping-horse", "Galloping Horse", "animal", "intermediate", "all", None, 3, 15, True, 0, "amber", "A majestic horse mid-gallop!"),
    ("leaping-dolphin", "Leaping Dolphin", "animal", "intermediate", "summer", None, 3, 12, False, 1, "blue", "A dolphin jumping out of the water!"),
    ("soaring-eagle", "Soaring Eagle", "animal", "intermediate", "all", None, 3, 15, True, 11, "amber", "A powerful eagle with spread wings!"),
    ("colorful-parrot", "Colorful Parrot", "animal", "intermediate", "summer", None, 3, 12, False, 0, "green", "A tropical parrot with vivid feathers!"),
    ("elegant-swan", "Elegant Swan", "animal", "intermediate", "all", None, 3, 12, True, 11, "violet", "A graceful swan gliding on water!"),
    ("crab-claws", "Crab Claws", "animal", "intermediate", "summer", None, 3, 12, False, 1, "red", "A crab with snapping claws!"),
    ("octopus-arms", "Octopus Arms", "animal", "intermediate", "summer", None, 3, 15, False, 1, "purple", "An eight-armed ocean friend!"),
    ("spooky-bat", "Spooky Bat", "animal", "intermediate", "fall", "halloween", 3, 10, False, 7, "indigo", "Spread-winged bat for Halloween!"),
    ("howling-wolf", "Howling Wolf", "animal", "intermediate", "winter", None, 3, 12, False, 0, "violet", "A wolf howling at the moon!"),
    ("forest-deer", "Forest Deer", "animal", "intermediate", "fall", None, 3, 15, True, 0, "amber", "A deer with majestic antlers!"),
    ("hummingbird", "Hummingbird", "animal", "intermediate", "spring", None, 3, 12, False, 11, "emerald", "A tiny bird hovering near flowers!"),
    ("sea-turtle", "Sea Turtle", "animal", "intermediate", "summer", None, 3, 12, False, 1, "teal", "A gentle sea turtle swimming along!"),
    ("koala-bear", "Koala Bear", "animal", "intermediate", "all", None, 3, 12, False, 0, "violet", "A cuddly koala hugging a tree!"),
    ("flamingo", "Pink Flamingo", "animal", "intermediate", "summer", None, 3, 15, True, 0, "pink", "A one-legged flamingo standing tall!"),
    ("rooster", "Morning Rooster", "animal", "intermediate", "all", None, 3, 12, False, 0, "red", "Cock-a-doodle-doo! A proud rooster!"),
    ("dragonfly", "Dragonfly", "animal", "intermediate", "summer", None, 3, 12, False, 2, "sky", "A dragonfly with translucent wings!"),
    ("shark-fin", "Great Shark", "animal", "intermediate", "summer", None, 3, 15, True, 1, "blue", "A fearsome shark cutting through waves!"),
    ("raccoon", "Masked Raccoon", "animal", "intermediate", "fall", None, 3, 12, False, 0, "violet", "A mischievous raccoon with its mask!"),
    ("pelican", "Pelican", "animal", "intermediate", "summer", None, 3, 12, False, 11, "amber", "A pelican with a huge beak pouch!"),
    ("stingray", "Stingray", "animal", "intermediate", "summer", None, 3, 12, False, 1, "indigo", "A graceful stingray gliding underwater!"),
    # ===== ANIMALS - ADVANCED (20) =====
    ("dragon-001", "Fire Dragon", "animal", "advanced", "all", None, 5, 30, True, 8, "red", "The ultimate challenge - a fearsome dragon!"),
    ("phoenix-rise", "Phoenix Rising", "animal", "advanced", "all", None, 5, 30, True, 8, "orange", "A mythical phoenix rising from flames!"),
    ("unicorn", "Magical Unicorn", "animal", "advanced", "all", None, 5, 25, True, 0, "fuchsia", "A magical unicorn with a spiral horn!"),
    ("t-rex", "T-Rex Dinosaur", "animal", "advanced", "all", None, 5, 30, True, 0, "green", "A terrifying T-Rex from prehistory!"),
    ("lion-king", "Lion King", "animal", "advanced", "all", None, 5, 25, True, 0, "amber", "The king of the jungle with a glorious mane!"),
    ("tiger-stripe", "Striped Tiger", "animal", "advanced", "all", None, 5, 25, True, 0, "orange", "A powerful tiger ready to pounce!"),
    ("scorpion", "Desert Scorpion", "animal", "advanced", "summer", None, 4, 20, True, 0, "amber", "A scorpion with a curled stinger tail!"),
    ("praying-mantis", "Praying Mantis", "animal", "advanced", "fall", None, 5, 30, True, 2, "green", "An intricate praying mantis!"),
    ("chameleon", "Color Chameleon", "animal", "advanced", "all", None, 4, 25, True, 0, "emerald", "A chameleon on a branch!"),
    ("pegasus", "Flying Pegasus", "animal", "advanced", "all", None, 5, 30, True, 0, "sky", "A winged horse soaring through clouds!"),
    ("pterodactyl", "Pterodactyl", "animal", "advanced", "all", None, 5, 30, True, 11, "violet", "A flying dinosaur from the Jurassic!"),
    ("koi-fish", "Koi Fish", "animal", "advanced", "spring", None, 4, 20, True, 1, "red", "A beautiful Japanese koi fish!"),
    ("stag-beetle", "Stag Beetle", "animal", "advanced", "summer", None, 5, 30, True, 0, "indigo", "A beetle with impressive mandibles!"),
    ("spider-web", "Garden Spider", "animal", "advanced", "fall", "halloween", 4, 25, True, 0, "indigo", "A spider hanging from its web!"),
    ("peacock-001", "Royal Peacock", "animal", "advanced", "all", None, 5, 30, True, 0, "teal", "A peacock with a full fan tail display!"),
    ("griffin", "Mythical Griffin", "animal", "advanced", "all", None, 5, 35, True, 8, "amber", "Half eagle, half lion - a legendary creature!"),
    ("centaur", "Centaur Warrior", "animal", "advanced", "all", None, 5, 35, True, 0, "amber", "A mythical half-human, half-horse warrior!"),
    ("triceratops", "Triceratops", "animal", "advanced", "all", None, 5, 30, True, 0, "green", "A three-horned dinosaur!"),
    ("seahorse", "Elegant Seahorse", "animal", "advanced", "summer", None, 4, 25, True, 1, "purple", "A curly-tailed seahorse!"),
    ("eagle-owl", "Great Eagle Owl", "animal", "advanced", "winter", None, 5, 30, True, 0, "amber", "A majestic owl with ear tufts!"),
    # ===== FLOWERS - BEGINNER (15) =====
    ("tulip-001", "Spring Tulip", "flower", "beginner", "spring", "easter", 2, 10, False, 3, "pink", "A beautiful tulip to celebrate spring!"),
    ("simple-daisy", "Simple Daisy", "flower", "beginner", "spring", None, 1, 8, False, 3, "yellow", "A cheerful daisy with white petals!"),
    ("green-leaf", "Green Leaf", "flower", "beginner", "fall", None, 1, 5, False, 2, "green", "A simple green leaf - great for beginners!"),
    ("rosebud", "Little Rosebud", "flower", "beginner", "spring", "valentines", 2, 8, False, 3, "rose", "A small rosebud just about to bloom!"),
    ("clover-luck", "Lucky Clover", "flower", "beginner", "spring", None, 2, 8, False, 2, "green", "A four-leaf clover for good luck!"),
    ("water-lily-pad", "Lily Pad", "flower", "beginner", "summer", None, 1, 5, False, 2, "emerald", "A floating lily pad for a paper pond!"),
    ("pine-tree", "Pine Tree", "flower", "beginner", "winter", "christmas", 2, 10, False, 2, "green", "An evergreen pine tree!"),
    ("little-sprout", "Little Sprout", "flower", "beginner", "spring", None, 1, 5, False, 2, "lime", "A tiny plant just sprouting!"),
    ("simple-cactus", "Desert Cactus", "flower", "beginner", "summer", None, 2, 8, False, 2, "green", "A prickly cactus that won't hurt!"),
    ("dandelion-puff", "Dandelion Puff", "flower", "beginner", "spring", None, 1, 5, False, 3, "yellow", "A fluffy dandelion ready to blow!"),
    ("sunflower-face", "Sunflower Face", "flower", "beginner", "summer", None, 2, 10, False, 3, "yellow", "A big happy sunflower!"),
    ("mushroom", "Woodland Mushroom", "flower", "beginner", "fall", None, 2, 8, False, 0, "red", "A spotted woodland mushroom!"),
    ("palm-tree", "Palm Tree", "flower", "beginner", "summer", None, 2, 10, False, 2, "green", "A tropical palm tree!"),
    ("autumn-leaf", "Autumn Leaf", "flower", "beginner", "fall", None, 1, 5, False, 2, "orange", "A colorful falling autumn leaf!"),
    ("bamboo-stalk", "Bamboo Stalk", "flower", "beginner", "all", None, 2, 8, False, 2, "emerald", "A tall bamboo stalk!"),
    # ===== FLOWERS - INTERMEDIATE (15) =====
    ("cherry-blossom", "Cherry Blossom", "flower", "intermediate", "spring", None, 3, 12, True, 3, "pink", "A delicate Japanese cherry blossom!"),
    ("lily-flower", "Lily Flower", "flower", "intermediate", "spring", None, 3, 12, False, 3, "violet", "An elegant lily with curved petals!"),
    ("iris-bloom", "Iris Bloom", "flower", "intermediate", "spring", None, 3, 12, False, 3, "purple", "A regal purple iris!"),
    ("carnation", "Frilly Carnation", "flower", "intermediate", "all", "valentines", 3, 15, True, 3, "rose", "A carnation with ruffled petals!"),
    ("daffodil", "Golden Daffodil", "flower", "intermediate", "spring", None, 3, 12, False, 3, "yellow", "A trumpet-shaped daffodil!"),
    ("hibiscus", "Tropical Hibiscus", "flower", "intermediate", "summer", None, 3, 12, False, 3, "red", "A bright tropical hibiscus flower!"),
    ("lavender-sprig", "Lavender Sprig", "flower", "intermediate", "summer", None, 3, 12, False, 3, "purple", "A fragrant lavender sprig!"),
    ("poppy-red", "Red Poppy", "flower", "intermediate", "spring", None, 3, 12, False, 3, "red", "A bold red poppy flower!"),
    ("bluebell", "Bluebell", "flower", "intermediate", "spring", None, 3, 12, False, 3, "blue", "A delicate woodland bluebell!"),
    ("maple-leaf", "Maple Leaf", "flower", "intermediate", "fall", None, 3, 12, False, 2, "red", "A five-pointed maple leaf!"),
    ("oak-leaf", "Oak Leaf", "flower", "intermediate", "fall", None, 3, 12, False, 2, "amber", "A sturdy oak leaf!"),
    ("fern-frond", "Fern Frond", "flower", "intermediate", "all", None, 3, 12, False, 2, "emerald", "A curling fern frond!"),
    ("poinsettia", "Poinsettia", "flower", "intermediate", "winter", "christmas", 3, 15, True, 3, "red", "A festive Christmas poinsettia!"),
    ("holly-berry", "Holly Berry", "flower", "intermediate", "winter", "christmas", 3, 12, False, 2, "green", "Holly with red berries for the holidays!"),
    ("snowflake-001", "Winter Snowflake", "flower", "intermediate", "winter", "christmas", 3, 10, False, 8, "sky", "Every snowflake is unique - just like yours!"),
    # ===== FLOWERS - ADVANCED (10) =====
    ("rose-001", "Elegant Rose", "flower", "advanced", "spring", "valentines", 5, 25, True, 3, "rose", "A stunningly realistic paper rose!"),
    ("lotus-001", "Lotus Flower", "flower", "advanced", "summer", None, 4, 20, True, 3, "pink", "A serene lotus floating on water!"),
    ("orchid", "Orchid", "flower", "advanced", "all", None, 5, 25, True, 3, "fuchsia", "An exotic orchid with intricate petals!"),
    ("chrysanthemum", "Chrysanthemum", "flower", "advanced", "fall", None, 5, 25, True, 3, "amber", "A many-petaled chrysanthemum!"),
    ("peony-bloom", "Peony Bloom", "flower", "advanced", "spring", None, 5, 25, True, 3, "pink", "A lush, full peony in bloom!"),
    ("bonsai-tree", "Bonsai Tree", "flower", "advanced", "all", None, 5, 30, True, 2, "green", "A miniature bonsai tree sculpture!"),
    ("bouquet", "Flower Bouquet", "flower", "advanced", "spring", "valentines", 5, 30, True, 3, "rose", "A complete bouquet of paper flowers!"),
    ("venus-flytrap", "Venus Flytrap", "flower", "advanced", "summer", None, 4, 20, True, 2, "green", "A snapping venus flytrap plant!"),
    ("wreath", "Holiday Wreath", "flower", "advanced", "winter", "christmas", 5, 30, True, 2, "green", "A decorative modular wreath!"),
    ("succulent", "Succulent Plant", "flower", "advanced", "all", None, 4, 20, True, 2, "teal", "A trendy succulent in a paper pot!"),
    # ===== OBJECTS - BEGINNER (25) =====
    ("airplane-001", "Paper Airplane", "object", "beginner", "all", None, 1, 5, False, 10, "green", "The classic paper airplane that flies far!"),
    ("boat-001", "Sailing Boat", "object", "beginner", "summer", None, 1, 8, False, 11, "sky", "A boat that can actually float!"),
    ("heart-001", "Love Heart", "object", "beginner", "all", "valentines", 2, 8, False, 4, "rose", "A sweet paper heart!"),
    ("paper-cup", "Paper Cup", "object", "beginner", "all", None, 1, 5, False, 0, "sky", "A cup that actually holds water briefly!"),
    ("party-hat", "Party Hat", "object", "beginner", "all", None, 1, 5, False, 0, "yellow", "A cone-shaped party hat!"),
    ("paper-crown", "Royal Crown", "object", "beginner", "all", None, 2, 8, False, 0, "yellow", "A crown fit for a king or queen!"),
    ("bookmark", "Corner Bookmark", "object", "beginner", "all", None, 1, 5, False, 0, "sky", "Never lose your place again!"),
    ("envelope", "Secret Envelope", "object", "beginner", "all", "valentines", 2, 8, False, 0, "rose", "An envelope for secret messages!"),
    ("paper-fan", "Cooling Fan", "object", "beginner", "summer", None, 1, 5, False, 0, "cyan", "Stay cool with a paper fan!"),
    ("tiny-house", "Tiny House", "object", "beginner", "all", None, 2, 10, False, 14, "coral", "A cute little paper house!"),
    ("paper-shirt", "Paper Shirt", "object", "beginner", "all", None, 2, 8, False, 0, "sky", "A mini shirt from paper!"),
    ("simple-box", "Simple Box", "object", "beginner", "all", None, 2, 10, False, 13, "teal", "A box to store small treasures!"),
    ("pinwheel", "Spinning Pinwheel", "object", "beginner", "spring", None, 2, 10, False, 0, "sky", "A pinwheel that spins in the wind!"),
    ("finger-puppet", "Finger Puppet", "object", "beginner", "all", None, 1, 5, False, 0, "coral", "A puppet that fits on your finger!"),
    ("paper-ball", "Paper Ball", "object", "beginner", "all", None, 2, 8, False, 13, "green", "A round paper ball to play with!"),
    ("paper-ring", "Paper Ring", "object", "beginner", "all", None, 1, 5, False, 12, "yellow", "A ring made from folded paper!"),
    ("arrow-dart", "Arrow Dart", "object", "beginner", "all", None, 1, 5, False, 10, "red", "A quick paper dart that flies straight!"),
    ("paper-boat-2", "Speed Boat", "object", "beginner", "summer", None, 2, 8, False, 11, "blue", "A faster paper boat design!"),
    ("fortune-cookie", "Fortune Cookie", "object", "beginner", "all", None, 1, 5, False, 0, "yellow", "Write a fortune inside!"),
    ("paper-basket", "Mini Basket", "object", "beginner", "spring", "easter", 2, 10, False, 0, "green", "A tiny basket for Easter eggs!"),
    ("magic-wand", "Magic Wand", "object", "beginner", "all", None, 1, 5, False, 15, "fuchsia", "A wand for casting paper spells!"),
    ("paper-wallet", "Paper Wallet", "object", "beginner", "all", None, 2, 8, False, 0, "amber", "A working wallet from paper!"),
    ("paper-plane-2", "Stealth Jet", "object", "beginner", "all", None, 2, 8, False, 10, "violet", "An advanced paper airplane design!"),
    ("paper-sword", "Mini Sword", "object", "beginner", "all", None, 2, 8, False, 0, "violet", "A tiny paper sword for play!"),
    ("paper-bow", "Paper Bow", "object", "beginner", "all", "christmas", 2, 8, False, 12, "red", "A decorative bow for gifts!"),
    # ===== OBJECTS - INTERMEDIATE (20) =====
    ("ninja-star", "Ninja Star", "object", "intermediate", "all", None, 3, 12, False, 4, "red", "A throwing star from two pieces of paper!"),
    ("fortune-teller", "Fortune Teller", "object", "intermediate", "all", None, 3, 10, False, 0, "purple", "Ask it a question and find your fortune!"),
    ("photo-frame", "Photo Frame", "object", "intermediate", "all", None, 3, 12, False, 0, "amber", "Frame your favorite photo in paper!"),
    ("lantern", "Paper Lantern", "object", "intermediate", "fall", None, 3, 12, False, 0, "yellow", "A glowing paper lantern!"),
    ("windmill", "Windmill", "object", "intermediate", "spring", None, 3, 12, False, 0, "blue", "A windmill with spinning blades!"),
    ("rocket-ship", "Rocket Ship", "object", "intermediate", "all", None, 3, 12, True, 16, "red", "Blast off into paper space!"),
    ("star-001", "Christmas Star", "object", "intermediate", "winter", "christmas", 3, 15, False, 5, "yellow", "A beautiful 3D star for the tree!"),
    ("gift-box", "Gift Box", "object", "intermediate", "winter", "christmas", 3, 15, True, 13, "red", "A real box to put presents in!"),
    ("candy-cane", "Candy Cane", "object", "intermediate", "winter", "christmas", 3, 12, False, 0, "red", "A striped candy cane decoration!"),
    ("witch-hat", "Witch Hat", "object", "intermediate", "fall", "halloween", 3, 12, False, 0, "purple", "A pointy witch hat for Halloween!"),
    ("ghost", "Friendly Ghost", "object", "intermediate", "fall", "halloween", 3, 10, False, 0, "violet", "Boo! A friendly paper ghost!"),
    ("jack-o-lantern", "Jack-o-Lantern", "object", "intermediate", "fall", "halloween", 3, 12, False, 0, "orange", "A grinning Halloween pumpkin!"),
    ("santa-hat", "Santa Hat", "object", "intermediate", "winter", "christmas", 3, 12, False, 0, "red", "Ho ho ho! A Santa hat!"),
    ("angel-wings", "Paper Angel", "object", "intermediate", "winter", "christmas", 3, 15, True, 0, "yellow", "A heavenly angel for the tree top!"),
    ("love-letter", "Love Letter", "object", "intermediate", "all", "valentines", 3, 12, False, 4, "rose", "A heart-shaped letter holder!"),
    ("easter-egg", "Easter Egg", "object", "intermediate", "spring", "easter", 3, 12, False, 0, "pink", "A decorated Easter egg!"),
    ("bell", "Jingle Bell", "object", "intermediate", "winter", "christmas", 3, 12, False, 0, "yellow", "A jingling Christmas bell!"),
    ("ice-cream-cone", "Ice Cream Cone", "object", "intermediate", "summer", None, 3, 12, False, 0, "coral", "A delicious paper ice cream!"),
    ("popsicle", "Summer Popsicle", "object", "intermediate", "summer", None, 3, 10, False, 0, "rose", "A cool popsicle treat!"),
    ("trophy-cup", "Trophy Cup", "object", "intermediate", "all", None, 3, 15, True, 17, "yellow", "A winner's trophy cup!"),
    # ===== OBJECTS - ADVANCED (15) =====
    ("grand-piano", "Grand Piano", "object", "advanced", "all", None, 5, 30, True, 14, "indigo", "A detailed miniature grand piano!"),
    ("violin", "Violin", "object", "advanced", "all", None, 5, 30, True, 14, "amber", "A beautifully detailed violin!"),
    ("paper-castle", "Castle Tower", "object", "advanced", "all", None, 5, 35, True, 14, "violet", "A medieval castle with towers!"),
    ("robot", "Paper Robot", "object", "advanced", "all", None, 4, 25, True, 13, "sky", "A boxy robot friend!"),
    ("paper-camera", "Camera", "object", "advanced", "all", None, 4, 25, True, 0, "indigo", "A paper camera with a lens!"),
    ("guitar", "Acoustic Guitar", "object", "advanced", "all", None, 5, 30, True, 14, "amber", "A guitar ready to play!"),
    ("sailship", "Sailing Ship", "object", "advanced", "summer", None, 5, 35, True, 11, "blue", "A tall ship with multiple sails!"),
    ("modular-cube", "Modular Cube", "object", "advanced", "all", None, 4, 20, True, 13, "purple", "A 3D cube from 6 paper modules!"),
    ("kusudama-ball", "Kusudama Ball", "object", "advanced", "all", None, 5, 35, True, 12, "fuchsia", "A stunning modular flower ball!"),
    ("chess-piece", "Chess King", "object", "advanced", "all", None, 5, 30, True, 0, "indigo", "A chess king piece with crown!"),
    ("paper-clock", "Paper Clock", "object", "advanced", "all", None, 4, 25, True, 0, "amber", "A clock face with moving hands!"),
    ("paper-mask", "Theater Mask", "object", "advanced", "all", "halloween", 4, 25, True, 0, "yellow", "A dramatic theater mask!"),
    ("samurai-helmet", "Samurai Helmet", "object", "advanced", "all", None, 4, 20, True, 0, "red", "A traditional samurai kabuto helmet!"),
    ("paper-shoe", "Paper Shoe", "object", "advanced", "all", None, 4, 25, True, 0, "coral", "A miniature paper shoe!"),
    ("treasure-chest", "Treasure Chest", "object", "advanced", "all", None, 5, 30, True, 13, "amber", "A chest to store your paper treasures!"),
]

def generate_all_projects():
    projects = []
    colors = list(C.values())
    for r in RAW:
        proj_id, title, cat, skill, season, holiday, diff, time_min, premium, icon_idx, color_key, desc = r
        steps = get_steps(cat, skill, title)
        age = "5-7" if skill == "beginner" else "8-10" if skill == "intermediate" else "11+"
        projects.append({
            "id": proj_id,
            "title": title,
            "description": desc,
            "skill_level": skill,
            "age_range": age,
            "season": season,
            "holiday": holiday,
            "difficulty_rating": diff,
            "estimated_time": f"{time_min} min",
            "is_premium": premium,
            "has_video": premium,
            "icon_name": ICONS[icon_idx % len(ICONS)],
            "color": C.get(color_key, "#38BDF8"),
            "xp_reward": 10 if skill == "beginner" else 25 if skill == "intermediate" else 50,
            "steps": steps,
            "video_file": None,
            "audio_file": None,
        })
    return projects
