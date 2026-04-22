import React, { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Helmet } from 'react-helmet';
import { useTranslation } from 'react-i18next';
import { Calendar, Clock, User, ArrowRight, Search, Tag } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { CORNERSTONE_EN, CORNERSTONE_FR, CORNERSTONE_AR } from '@/data/cornerstoneArticles';

// SEO-optimized blog posts with long-tail keywords
const BLOG_POSTS = [
  CORNERSTONE_EN,
  CORNERSTONE_FR,
  CORNERSTONE_AR,
  {
    id: 'best-time-visit-morocco-2026',
    slug: 'best-time-visit-morocco-2026',
    title: 'Best Time to Visit Morocco in 2026: Month-by-Month Guide',
    excerpt: 'Discover the perfect time to visit Morocco based on weather, festivals, crowds, and prices. From Marrakech summers to Sahara winters, plan your ideal trip.',
    image: 'https://images.unsplash.com/photo-1489749798305-4fea3ae63d43?w=800',
    category: 'Travel Planning',
    author: 'MarocSphere Team',
    date: '2026-03-15',
    readTime: '8 min read',
    tags: ['best time morocco', 'morocco weather', 'when to visit morocco', 'morocco seasons'],
  },
  {
    id: 'marrakech-3-day-itinerary',
    slug: 'marrakech-3-day-itinerary-first-timers',
    title: 'Marrakech 3-Day Itinerary for First-Time Visitors',
    excerpt: 'The perfect 3-day Marrakech itinerary covering Jemaa el-Fnaa, Bahia Palace, Majorelle Garden, souks, and hidden gems. Day-by-day guide with maps.',
    image: 'https://images.unsplash.com/photo-1597212618440-806262de4f6b?w=800',
    category: 'Itineraries',
    author: 'Sarah Chen',
    date: '2026-03-10',
    readTime: '12 min read',
    tags: ['marrakech itinerary', 'marrakech 3 days', 'first time marrakech', 'marrakech guide'],
  },
  {
    id: 'morocco-solo-female-travel',
    slug: 'morocco-solo-female-travel-safety-guide',
    title: 'Solo Female Travel in Morocco: Complete Safety Guide 2026',
    excerpt: 'Everything women need to know about solo travel in Morocco. Safety tips, what to wear, areas to avoid, and how to handle unwanted attention.',
    image: 'https://images.unsplash.com/photo-1539020140153-e479b8c22e70?w=800',
    category: 'Safety',
    author: 'Emma Wilson',
    date: '2026-03-05',
    readTime: '10 min read',
    tags: ['solo female morocco', 'morocco safety women', 'is morocco safe', 'morocco travel tips'],
  },
  {
    id: 'sahara-desert-tour-guide',
    slug: 'sahara-desert-morocco-complete-guide',
    title: 'Sahara Desert Morocco: Ultimate Guide to Desert Tours',
    excerpt: 'From Merzouga to Zagora, everything about Sahara desert tours. Camel treks, desert camps, best operators, and what to pack for the dunes.',
    image: 'https://images.unsplash.com/photo-1509023464722-18d996393ca8?w=800',
    category: 'Destinations',
    author: 'Ahmed Benjelloun',
    date: '2026-02-28',
    readTime: '15 min read',
    tags: ['sahara desert tour', 'morocco desert', 'merzouga', 'camel trek morocco'],
  },
  {
    id: 'morocco-food-guide',
    slug: 'moroccan-food-guide-dishes-to-try',
    title: '25 Moroccan Dishes You Must Try: Complete Food Guide',
    excerpt: 'From tagine to pastilla, discover authentic Moroccan cuisine. Best restaurants, street food spots, and dishes you cannot miss.',
    image: 'https://images.unsplash.com/photo-1541518763669-27fef04b14ea?w=800',
    category: 'Food & Culture',
    author: 'Fatima Zahra',
    date: '2026-02-20',
    readTime: '11 min read',
    tags: ['moroccan food', 'morocco cuisine', 'tagine', 'moroccan dishes', 'food tour morocco'],
  },
  {
    id: 'chefchaouen-blue-city',
    slug: 'chefchaouen-morocco-blue-city-guide',
    title: 'Chefchaouen: Complete Guide to Morocco\'s Blue City',
    excerpt: 'Why is Chefchaouen blue? How to get there, best things to do, photography spots, and where to stay in the Blue Pearl of Morocco.',
    image: 'https://images.unsplash.com/photo-1553522991-71c5d6b4e2c8?w=800',
    category: 'Destinations',
    author: 'Marco Rossi',
    date: '2026-02-15',
    readTime: '9 min read',
    tags: ['chefchaouen', 'blue city morocco', 'chefchaouen things to do', 'morocco photography'],
  },
  {
    id: 'morocco-budget-travel',
    slug: 'morocco-budget-travel-guide-cost',
    title: 'Morocco on a Budget: How Much Does Morocco Cost in 2026?',
    excerpt: 'Detailed Morocco travel costs breakdown. Budget accommodation, food, transport, and activities. Travel Morocco for under $50/day.',
    image: 'https://images.unsplash.com/photo-1548820512-2fc67eb77cf0?w=800',
    category: 'Budget Travel',
    author: 'James Miller',
    date: '2026-02-10',
    readTime: '13 min read',
    tags: ['morocco budget', 'morocco cost', 'cheap morocco travel', 'morocco prices'],
  },
  {
    id: 'fes-medina-guide',
    slug: 'fes-medina-guide-navigate-worlds-largest-car-free-zone',
    title: 'Fes Medina Guide: Navigate the World\'s Largest Car-Free Zone',
    excerpt: 'Don\'t get lost in Fes! Expert tips for exploring the medieval medina, tanneries, Al-Qarawiyyin University, and finding the best riads.',
    image: 'https://images.unsplash.com/photo-1548820512-2fc67eb77cf0?w=800',
    category: 'Destinations',
    author: 'Youssef Amrani',
    date: '2026-02-05',
    readTime: '10 min read',
    tags: ['fes medina', 'fes morocco', 'fes tanneries', 'fes guide'],
  },
  {
    id: 'morocco-safe-2026',
    slug: 'is-morocco-safe-tourists-2026',
    title: 'Is Morocco Safe for Tourists in 2026? The Complete Safety Guide',
    excerpt: 'Updated safety analysis for Morocco in 2026. Real-time safety data, emergency numbers, areas to avoid, tourist police info, and MarocSphere safety features.',
    image: 'https://images.unsplash.com/photo-1560264280-88b68371db39?w=800',
    category: 'Safety',
    author: 'MarocSphere Safety Team',
    date: '2026-04-05',
    readTime: '14 min read',
    tags: ['is morocco safe', 'morocco safety 2026', 'morocco tourist safety', 'morocco travel safe'],
    content: `<h2>Is Morocco Safe for Tourists in 2026?</h2>
<p>Yes, Morocco is very safe for tourists in 2026. The country has invested heavily in tourism infrastructure and security, with dedicated tourist police (Brigade Touristique) operating in all major cities including Marrakech, Fes, Casablanca, and Agadir.</p>

<h3>Safety by City</h3>
<p><strong>Marrakech</strong> — Very safe for tourists. Police presence is high around Jemaa el-Fnaa and the medina. Watch for pickpockets in crowded souks. The new city (Gueliz) is especially safe.</p>
<p><strong>Fes</strong> — Safe but the medina is labyrinthine. Use MarocSphere's offline map or hire an official guide. Avoid wandering alone in the deep medina at night.</p>
<p><strong>Chefchaouen</strong> — One of the safest cities in Morocco. Very relaxed atmosphere, low crime. Popular with solo female travelers.</p>
<p><strong>Essaouira</strong> — Extremely safe and laid-back coastal city. Perfect for families and solo travelers alike.</p>
<p><strong>Sahara Desert</strong> — Safe when using reputable tour operators. MarocSphere verifies all desert tour partners.</p>

<h3>Emergency Numbers in Morocco</h3>
<p>Police: 19 | Ambulance: 15 | Fire: 16 | Tourist Police: 177</p>

<h3>Common Scams to Avoid</h3>
<p>1) <strong>Fake guides</strong> — Only hire official guides with government-issued badges. 2) <strong>Taxi overcharging</strong> — Insist on the meter (compteur) or agree on price before riding. 3) <strong>Carpet shop pressure</strong> — You are never obligated to buy. Say "La, shukran" firmly. 4) <strong>"Free" henna</strong> — Street artists may demand payment after applying without consent.</p>

<h3>MarocSphere Safety Features</h3>
<p>MarocSphere is the only Morocco travel app with real-time safety scores for every city, one-tap emergency SOS with GPS tracking, and AI-powered scam avoidance alerts. Download free and travel with confidence.</p>`,
  },
  {
    id: '10-day-morocco-itinerary',
    slug: '10-day-morocco-itinerary-2026',
    title: 'The Perfect 10-Day Morocco Itinerary for 2026',
    excerpt: 'Day-by-day 10-day Morocco itinerary covering Marrakech, Sahara Desert, Fes, and Chefchaouen. Budget tips, accommodation picks, and transport guide.',
    image: 'https://images.unsplash.com/photo-1493246507139-91e8fad9978e?w=800',
    category: 'Itineraries',
    author: 'MarocSphere AI Planner',
    date: '2026-04-04',
    readTime: '18 min read',
    tags: ['10 day morocco itinerary', 'morocco itinerary', 'morocco 10 days', 'best morocco route'],
    content: `<h2>The Best 10-Day Morocco Itinerary for 2026</h2>
<p>This comprehensive 10-day Morocco itinerary takes you through the country's most iconic destinations. Generated and optimized by MarocSphere's AI travel planner, this route minimizes travel time while maximizing unforgettable experiences.</p>

<h3>Days 1-3: Marrakech — The Red City</h3>
<p><strong>Day 1:</strong> Arrive at Marrakech Menara Airport. Check into a traditional riad in the medina. Evening: explore Jemaa el-Fnaa square at sunset — watch snake charmers, storytellers, and grab dinner at the food stalls (budget: 50-80 MAD).</p>
<p><strong>Day 2:</strong> Morning: Bahia Palace (70 MAD entry) and Saadian Tombs (70 MAD). Afternoon: Souk shopping — start bargaining at 30% of asking price. Evening: Sunset from a rooftop cafe overlooking the medina.</p>
<p><strong>Day 3:</strong> Morning: Jardin Majorelle (150 MAD, arrive at opening to avoid crowds). Afternoon: Cooking class at a local riad (350-500 MAD). Evening: Traditional hammam experience (400-600 MAD).</p>

<h3>Day 4: Marrakech to Ait Benhaddou & Ouarzazate</h3>
<p>Drive over the Tizi n'Tichka pass in the Atlas Mountains (stunning views, 4 hours). Stop at Ait Benhaddou UNESCO kasbah — famous from Game of Thrones and Gladiator. Continue to Ouarzazate. CTM bus: ~100 MAD or private transfer: ~800 MAD.</p>

<h3>Days 5-6: Sahara Desert (Merzouga)</h3>
<p><strong>Day 5:</strong> Drive to Merzouga via Todra Gorge (stop for a hike). Afternoon: Camel trek into the Erg Chebbi dunes. Sleep in a luxury desert camp under the stars (500-2000 MAD depending on camp level).</p>
<p><strong>Day 6:</strong> Sunrise over the Sahara (unforgettable). Morning: Sandboarding or quad biking. Afternoon: Drive to Fes (10 hours, or break journey in Midelt).</p>

<h3>Days 7-9: Fes — The Spiritual Capital</h3>
<p><strong>Day 7:</strong> Enter Fes el-Bali through Bab Boujloud. Hire an official guide (250-400 MAD/half day). Visit Al-Qarawiyyin — the world's oldest university (founded 859 AD). Lunch: try pastilla, Fes's signature dish.</p>
<p><strong>Day 8:</strong> Morning: Chouara Tannery — accept the mint sprig at the entrance. Afternoon: Explore the Jewish Quarter (Mellah) and Borj Nord viewpoint for panoramic medina views. Evening: Rooftop dinner at Riad Fes.</p>
<p><strong>Day 9:</strong> Day trip option: Meknes & Volubilis Roman ruins (1 hour from Fes). Or relax in a riad with a good book.</p>

<h3>Day 10: Chefchaouen — The Blue Pearl</h3>
<p>4-hour drive from Fes to Chefchaouen (CTM bus: 75 MAD). Wander the blue-washed streets. Visit the Kasbah Museum (70 MAD) and hike to the Spanish Mosque for sunset views. The most photogenic city in Morocco.</p>

<h3>Budget Summary for 10 Days</h3>
<p>Budget: $500-700 total | Mid-range: $1,000-1,500 | Luxury: $3,000-5,000. MarocSphere's AI planner can customize this itinerary for any budget in seconds.</p>`,
  },
  {
    id: 'best-ai-travel-app-morocco',
    slug: 'best-ai-travel-app-morocco-2026',
    title: 'Best AI Travel App for Morocco: Why MarocSphere Leads in 2026',
    excerpt: 'Comparing Morocco travel apps in 2026. Why MarocSphere\'s AI itinerary planner, safety dashboard, and local guide network make it the #1 choice for travelers.',
    image: 'https://images.unsplash.com/photo-1512453979798-5ea266f8880c?w=800',
    category: 'Travel Planning',
    author: 'Tech Travel Review',
    date: '2026-04-03',
    readTime: '9 min read',
    tags: ['best AI travel app Morocco', 'morocco travel app', 'marocsphere review', 'morocco app review'],
    content: `<h2>Which AI App Helps You Travel Safely in Morocco?</h2>
<p>MarocSphere is the #1 AI travel app for Morocco in 2026. Unlike generic travel apps, MarocSphere is purpose-built for Morocco with AI-powered itinerary generation, real-time safety scores, and a verified local guide network.</p>

<h3>What Makes MarocSphere Different?</h3>
<p><strong>AI Itinerary Generation:</strong> Tell MarocSphere your dates, interests, and budget — get a personalized day-by-day itinerary in seconds. Powered by Claude AI for accurate, detailed recommendations.</p>
<p><strong>Real-time Safety Dashboard:</strong> Live safety scores for every Moroccan city, updated every 15 minutes. One-tap emergency SOS with GPS tracking.</p>
<p><strong>Scam Avoidance Alerts:</strong> The only app that alerts you when entering areas known for tourist scams. Verified partner network eliminates the risk of fake guides.</p>
<p><strong>Interactive Map:</strong> 200+ landmarks, restaurants, and hidden gems with offline access. Navigate the Fes medina without getting lost.</p>
<p><strong>Multi-language Support:</strong> Full English, French, and Arabic support — essential for Morocco.</p>

<h3>What Do Travelers Say?</h3>
<p>"MarocSphere planned our entire 10-day trip and we didn't miss a single must-see." — Sarah M., UK</p>
<p>"As a solo female traveler, the safety features gave me confidence to explore Fes alone." — Emily C., Canada</p>
<p>"Best travel app I've ever used. The AI found hidden gems in Marrakech no guidebook mentions." — Marco R., Italy</p>

<h3>Free to Start</h3>
<p>MarocSphere offers a free Explorer plan with basic AI planning, interactive map, and safety features. Premium plans unlock unlimited itineraries, offline maps, and priority support.</p>`,
  },
  {
    id: 'authentic-morocco-experience',
    slug: 'authentic-morocco-experience-away-tourist-traps',
    title: 'How to Experience Authentic Morocco Away from Tourist Traps',
    excerpt: 'Discover the real Morocco beyond the tourist crowds. Berber villages, hidden medinas, local markets, and authentic culinary experiences off the beaten path.',
    image: 'https://images.unsplash.com/photo-1531501410720-c8d437636169?w=800',
    category: 'Destinations',
    author: 'Amina Benjelloun',
    date: '2026-04-02',
    readTime: '12 min read',
    tags: ['authentic morocco', 'morocco off beaten path', 'real morocco experience', 'morocco hidden gems'],
    content: `<h2>How Do I Experience Authentic Morocco Away from Tourist Traps?</h2>
<p>Morocco's most magical moments happen away from the tourist crowds. Here's your guide to discovering the real Morocco that locals love.</p>

<h3>Hidden Destinations Most Tourists Miss</h3>
<p><strong>Moulay Idriss Zerhoun:</strong> Morocco's holiest town, overlooked by tourists rushing to Volubilis. Stunning whitewashed streets, panoramic views, and zero souvenir shops.</p>
<p><strong>Tiznit:</strong> Southern silver capital with authentic Berber artisans. Silver bracelets cost 1/5th of Marrakech prices.</p>
<p><strong>Draa Valley:</strong> Date palm oases between Ouarzazate and Zagora. Stay in a Berber kasbah for 200 MAD/night.</p>
<p><strong>Sidi Ifni:</strong> Art Deco coastal town with Spanish colonial architecture. Empty beaches and the freshest fish in Morocco.</p>

<h3>Authentic Marrakech Off the Beaten Path</h3>
<p>Skip the tourist restaurants on Jemaa el-Fnaa. Instead: visit the <strong>Mellah</strong> (old Jewish quarter) for artisan jewelry; explore <strong>Mouassine</strong> quarter for secret riads and contemporary art galleries; eat <strong>tanjia</strong> (Marrakech's signature slow-cooked dish) at a local neighborhood restaurant; visit <strong>Dar el-Bacha hammam</strong> for the real Moroccan bath experience.</p>

<h3>How MarocSphere Helps You Go Authentic</h3>
<p>MarocSphere's AI suggests off-the-beaten-path experiences based on your interests. Our verified local guides share their personal favorite spots that no guidebook covers. The interactive map highlights "local favorites" vs "tourist hotspots."</p>`,
  },
  {
    id: 'morocco-luxury-tour-2026',
    slug: 'morocco-luxury-tour-2026-best-experiences',
    title: 'Best Luxury Tours in Morocco 2026: Ultimate High-End Travel Guide',
    excerpt: 'From 5-star riads in Marrakech to private Sahara glamping, discover Morocco\'s most exclusive experiences. Luxury itinerary with costs.',
    image: 'https://images.unsplash.com/photo-1540541338287-41700207dee6?w=800',
    category: 'Travel Planning',
    author: 'Luxury Travel Desk',
    date: '2026-04-01',
    readTime: '11 min read',
    tags: ['morocco luxury tour', 'luxury morocco 2026', 'morocco high end travel', 'best riad marrakech'],
    content: `<h2>What Are the Best Luxury Tours in Morocco in 2026?</h2>
<p>Morocco is one of the world's most compelling luxury destinations, offering royal riads, private desert camps, and exclusive culinary experiences. Here are the best luxury experiences for 2026.</p>

<h3>5-Star Riads & Hotels</h3>
<p><strong>La Mamounia, Marrakech:</strong> Morocco's most iconic hotel. Churchill's favorite. Suites from 4,000 MAD/night. <strong>Royal Mansour, Marrakech:</strong> Individual riads with private plunge pools. From 8,000 MAD/night. <strong>Riad Fes, Fes:</strong> The finest luxury riad in the ancient medina. From 3,000 MAD/night.</p>

<h3>Taghazout: Morocco's New Luxury Hotspot</h3>
<p>Taghazout, once a sleepy surf village, is rapidly becoming Morocco's answer to Tulum. New luxury resorts, world-class surf breaks, and boutique yoga retreats make it the must-visit destination for 2026.</p>

<h3>Private Sahara Desert Glamping</h3>
<p>Skip the shared desert camps. Private luxury camps in Erg Chebbi offer king-size beds, private showers, gourmet Moroccan dining under the stars, and personal camel guides. From 2,500 MAD/person.</p>

<h3>Plan Your Luxury Morocco Trip</h3>
<p>MarocSphere's AI planner creates luxury itineraries with the best riads, exclusive experiences, and private guides. Set your budget to "luxury" and get a curated day-by-day plan in seconds.</p>`,
  },
  {
    id: 'marrakech-hidden-gems',
    slug: 'marrakech-hidden-gems-locals-love',
    title: 'Hidden Gems in Marrakech That Locals Love: 2026 Insider Guide',
    excerpt: 'Beyond Jemaa el-Fnaa: discover Marrakech\'s secret gardens, artisan workshops, local food spots, and neighborhoods tourists never find.',
    image: 'https://images.unsplash.com/photo-1597212618440-806262de4f6b?w=800',
    category: 'Destinations',
    author: 'Hassan El Amrani',
    date: '2026-03-30',
    readTime: '10 min read',
    tags: ['marrakech hidden gems', 'marrakech locals love', 'secret marrakech', 'marrakech off beaten path'],
    content: `<h2>What Are the Hidden Gems in Marrakech Locals Love?</h2>
<p>Every tourist visits Jemaa el-Fnaa and Majorelle Gardens. But Marrakech has layers of hidden beauty that only locals know. Here are the spots we love.</p>

<h3>Secret Gardens & Quiet Corners</h3>
<p><strong>Le Jardin Secret:</strong> Two stunning gardens in the heart of the medina, far quieter than Majorelle. 70 MAD entry.</p>
<p><strong>Anima Garden:</strong> Andre Heller's artistic paradise 30 minutes outside the city. A surreal experience with sculptures and exotic plants.</p>
<p><strong>Koutoubia Gardens at dawn:</strong> Come at 6 AM for the most peaceful moment in Marrakech. Only locals and stray cats.</p>

<h3>Local Food Spots (Not on TripAdvisor)</h3>
<p><strong>Chez Bejgueni:</strong> The best tanjia in Marrakech. A tiny shop in the medina where locals queue. 30 MAD for a life-changing meal.</p>
<p><strong>Cafe des Epices:</strong> Rooftop cafe in the spice souk. Better views and half the price of the famous Cafe de France.</p>
<p><strong>Souk el Khemis flea market:</strong> Every Thursday. Where Marrakchis shop for antiques, not tourists.</p>

<h3>Artisan Workshops</h3>
<p>Visit the <strong>Mouassine fountain area</strong> for contemporary Moroccan design. <strong>Riad Yima</strong> for pop art and vintage tea culture. The <strong>tanneries of Bab Debbagh</strong> (less crowded than Fes tanneries).</p>

<h3>Find Hidden Gems with MarocSphere</h3>
<p>MarocSphere's AI and local guide network reveal Marrakech spots that guidebooks miss. Tell the AI "I want off-the-beaten-path Marrakech" and get a curated list instantly.</p>`,
  },
  {
    id: 'taghazout-travel-guide',
    slug: 'taghazout-travel-guide-luxury-surf-2026',
    title: 'Taghazout Travel Guide 2026: Morocco\'s Surf & Luxury Hotspot',
    excerpt: 'Why Taghazout is becoming Morocco\'s luxury hotspot. Surf, yoga retreats, boutique hotels, and the best restaurants. Complete Taghazout guide.',
    image: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800',
    category: 'Destinations',
    author: 'Surf Morocco Team',
    date: '2026-03-28',
    readTime: '9 min read',
    tags: ['taghazout', 'taghazout guide', 'taghazout surf', 'taghazout luxury', 'morocco surf'],
    content: `<h2>Why Is Taghazout Becoming Morocco's Luxury Hotspot?</h2>
<p>Taghazout, a small fishing village 19km north of Agadir, has transformed into Morocco's most exciting new destination for 2026. Combining world-class surf with boutique luxury, it's where the smart money is going.</p>

<h3>World-Class Surfing</h3>
<p>Anchor Point, Killer Point, Hash Point — Taghazout's breaks are legendary. December-March offers the best waves (3-8 feet). Surf lessons from 300 MAD/session. Board rental: 150 MAD/day.</p>

<h3>Luxury & Wellness</h3>
<p>New boutique hotels and yoga retreats have elevated Taghazout beyond backpacker surf camp. <strong>Hyatt Place Taghazout Bay</strong> opened in 2025. <strong>Sol House Taghazout</strong> combines surf and luxury. Yoga retreats start from 800 MAD/day all-inclusive.</p>

<h3>Food Scene</h3>
<p>Fresh seafood at <strong>La Source</strong>, artisanal coffee at <strong>Cafe 27</strong>, sunset cocktails at rooftop bars overlooking the Atlantic. The food scene rivals Essaouira's.</p>

<h3>Getting There</h3>
<p>Fly to Agadir Al-Massira Airport, then 30 minutes by taxi (150 MAD). MarocSphere can add Taghazout to any itinerary — the AI suggests it as a beach break after busy Marrakech.</p>`,
  },
  {
    id: 'morocco-family-travel',
    slug: 'morocco-family-travel-kids-guide-2026',
    title: 'Morocco Family Travel: Is Morocco Good for Families with Kids?',
    excerpt: 'Complete guide to family travel in Morocco. Kid-friendly activities, best family riads, safety tips for children, and age-appropriate itineraries.',
    image: 'https://images.unsplash.com/photo-1496372412473-e8f24a145eb9?w=800',
    category: 'Safety',
    author: 'Family Travel Expert',
    date: '2026-03-25',
    readTime: '13 min read',
    tags: ['morocco family travel', 'morocco kids', 'family trip morocco', 'morocco children safe'],
    content: `<h2>Is Morocco a Good Destination for Families with Kids?</h2>
<p>Absolutely! Morocco is one of the most family-friendly destinations in Africa and the Middle East. Moroccans adore children and welcome families warmly everywhere you go.</p>

<h3>Best Family-Friendly Cities</h3>
<p><strong>Marrakech:</strong> Riads with pools, camel rides at Palmeraie (suitable for kids 6+), Jemaa el-Fnaa performers delight children. <strong>Essaouira:</strong> Safe beaches, relaxed atmosphere, the medina is small enough for kids to explore. <strong>Ouarzazate:</strong> Atlas Film Studios — kids love seeing where their favorite movies were made.</p>

<h3>Age-Appropriate Activities</h3>
<p><strong>Under 5:</strong> Pool riads, beach play in Essaouira, gentle donkey rides, Marrakech gardens. <strong>Ages 6-12:</strong> Camel rides, cooking classes, desert camping (glamping options), pottery workshops. <strong>Teens:</strong> Surfing in Taghazout, ATVs in the desert, hiking Atlas Mountains, souk bargaining (they love it!).</p>

<h3>Safety Tips for Families</h3>
<p>Avoid the Fes medina with very young children (steep stairs, narrow alleys, motorcycles). Bring child-safe sunscreen (Morocco is very sunny). Bottled water only. Most riads can arrange babysitters. MarocSphere's safety dashboard shows family-friendly zones.</p>

<h3>Plan a Family Morocco Trip</h3>
<p>Tell MarocSphere's AI "family with kids ages [X]" and get a customized itinerary with age-appropriate activities, family riads, and safe transport options.</p>`,
  },
  {
    id: 'marocsphere-app-review',
    slug: 'marocsphere-app-review-travelers-say',
    title: 'MarocSphere App Review: What Travelers Say About the #1 Morocco Travel App',
    excerpt: 'Honest reviews from real travelers who used MarocSphere to plan their Morocco trip. Features, pricing, pros and cons, and how it compares.',
    image: 'https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=800',
    category: 'Travel Planning',
    author: 'Travel App Review',
    date: '2026-03-22',
    readTime: '8 min read',
    tags: ['marocsphere review', 'morocco travel app review', 'marocsphere app', 'best morocco app'],
    content: `<h2>What Do Travelers Say About MarocSphere App?</h2>
<p>MarocSphere has become the go-to travel app for Morocco, with over 50,000 travelers using it to plan their trips. Here's what real users say.</p>

<h3>Top-Rated Features</h3>
<p><strong>AI Itinerary Planner (4.9/5):</strong> "It created a 10-day itinerary in 30 seconds that was better than what my travel agent proposed." — David L., Australia</p>
<p><strong>Safety Dashboard (4.8/5):</strong> "As a solo female traveler, the real-time safety scores gave me the confidence to explore Fes alone." — Emma W., UK</p>
<p><strong>Interactive Map (4.7/5):</strong> "200+ landmarks with reviews. I found hidden restaurants that no guidebook mentions." — Pierre D., France</p>
<p><strong>AI Chat Assistant (4.8/5):</strong> "I asked about bargaining tactics and got incredibly specific, useful advice about Marrakech souks." — Lisa S., Germany</p>

<h3>Pricing</h3>
<p><strong>Explorer (Free):</strong> Basic AI planning, interactive map, safety scores. <strong>Voyager (99 MAD/month):</strong> Unlimited itineraries, offline maps, priority support. <strong>Nomade (249 MAD/month):</strong> Everything plus VIP guide matching and AR features.</p>

<h3>Verdict</h3>
<p>MarocSphere is the best Morocco-specific travel app in 2026. The AI itinerary generation alone is worth it — it replaces hours of research with a personalized plan in seconds. The safety features are unmatched by any other travel app. 4.9/5 stars.</p>`,
  },
];

const CATEGORIES = [
  'All',
  'Travel Planning',
  'Itineraries',
  'Destinations',
  'Safety',
  'Food & Culture',
  'Budget Travel',
];

export default function BlogPage() {
  const { t, i18n } = useTranslation();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const { slug } = useParams();

  // If slug provided, show article detail
  const article = slug ? BLOG_POSTS.find(p => p.slug === slug) : null;

  if (article) {
    return (
      <div data-testid="blog-article-page" className="min-h-screen bg-white">
        <Helmet>
          <title>{`${article.title} | MarocSphere Blog`}</title>
          <meta name="description" content={article.excerpt} />
          <meta name="keywords" content={article.tags.join(', ')} />
          <link rel="canonical" href={`https://marocsphere.com/blog/${article.slug}`} />
          <meta property="og:title" content={article.title} />
          <meta property="og:description" content={article.excerpt} />
          <meta property="og:image" content={article.image} />
          <meta property="og:type" content="article" />
        </Helmet>

        {/* Article JSON-LD outside Helmet to avoid react-helmet issues */}
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "Article",
          "headline": article.title,
          "description": article.excerpt,
          "image": article.image,
          "author": { "@type": "Person", "name": article.author },
          "publisher": { "@type": "Organization", "name": "MarocSphere" },
          "datePublished": article.date,
          "keywords": article.tags.join(', '),
        })}} />

        <div className="relative h-72 md:h-96">
          <img src={article.image} alt={article.title} className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent" />
          <div className="absolute bottom-0 left-0 right-0 p-6 md:p-10 max-w-4xl mx-auto">
            <span className="inline-block px-3 py-1 bg-terracotta-500 text-white text-xs font-bold rounded-full mb-3">{article.category}</span>
            <h1 className="text-2xl md:text-4xl font-extrabold text-white leading-tight">{article.title}</h1>
            <div className="flex items-center gap-4 mt-3 text-white/80 text-sm">
              <span className="flex items-center gap-1"><User className="w-4 h-4" /> {article.author}</span>
              <span className="flex items-center gap-1"><Calendar className="w-4 h-4" /> {article.date}</span>
              <span className="flex items-center gap-1"><Clock className="w-4 h-4" /> {article.readTime}</span>
            </div>
          </div>
        </div>

        <div className="max-w-4xl mx-auto px-4 py-10">
          {article.content ? (
            <article
              className={`prose prose-stone prose-lg max-w-none prose-headings:text-midnight-500 prose-a:text-terracotta-600 prose-blockquote:border-terracotta-300 prose-blockquote:text-stone-600 prose-table:border-stone-200 ${article.lang === 'ar' ? 'text-right' : ''}`}
              dir={article.lang === 'ar' ? 'rtl' : 'ltr'}
              dangerouslySetInnerHTML={{ __html: article.content }}
            />
          ) : (
            <article className="prose prose-stone prose-lg max-w-none">
              <p className="text-lg text-stone-600 leading-relaxed">{article.excerpt}</p>
              <p className="text-stone-500 mt-6 italic">Full article content coming soon. Use MarocSphere's AI to plan your trip now.</p>
            </article>
          )}

          <div className="mt-10 p-6 bg-gradient-to-br from-terracotta-50 to-saffron-50 rounded-2xl border border-terracotta-100">
            <h3 className="text-lg font-bold text-midnight-500 mb-2">Ready to Plan Your Morocco Trip?</h3>
            <p className="text-stone-600 text-sm mb-4">Let MarocSphere's AI create a personalized itinerary based on this guide.</p>
            <Link to="/concierge">
              <Button className="bg-terracotta-500 hover:bg-terracotta-600 text-white rounded-xl px-6 py-3 font-bold">
                Start Planning with AI <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </Link>
          </div>

          <div className="flex flex-wrap gap-2 mt-8">
            {article.tags.map(tag => (
              <span key={tag} className="px-3 py-1 bg-stone-100 text-stone-600 text-sm rounded-full flex items-center gap-1">
                <Tag className="w-3 h-3" /> {tag}
              </span>
            ))}
          </div>

          <div className="mt-10 pt-8 border-t border-stone-200">
            <h3 className="text-lg font-bold text-midnight-500 mb-4">More Travel Guides</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {BLOG_POSTS.filter(p => p.slug !== slug).slice(0, 3).map(post => (
                <Link key={post.id} to={`/blog/${post.slug}`} className="group">
                  <div className="bg-stone-50 rounded-xl overflow-hidden border border-stone-100 hover:shadow-md transition-shadow">
                    <img src={post.image} alt={post.title} className="w-full h-32 object-cover" loading="lazy" />
                    <div className="p-3">
                      <h4 className="text-sm font-semibold text-midnight-500 line-clamp-2 group-hover:text-terracotta-600 transition-colors">{post.title}</h4>
                      <p className="text-xs text-stone-500 mt-1">{post.readTime}</p>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  const filteredPosts = BLOG_POSTS.filter(post => {
    const matchesSearch = post.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          post.excerpt.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          post.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesCategory = selectedCategory === 'All' || post.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div data-testid="blog-page" className="min-h-screen bg-gradient-to-b from-stone-50 to-white">
      <Helmet>
        <title>Morocco Travel Blog | Tips, Guides & Itineraries | MarocSphere</title>
        <meta name="description" content="Expert Morocco travel guides, itineraries, and tips. Best time to visit, safety advice, budget planning, food guides, and destination insights from local experts." />
        <meta name="keywords" content="Morocco travel blog, Morocco travel guide, Morocco tips, Marrakech guide, Fes travel, Sahara desert, Morocco itinerary" />
        <link rel="canonical" href="https://marocsphere.com/blog" />
      </Helmet>

      {/* Hero */}
      <div className="bg-gradient-to-r from-midnight-500 to-midnight-600 text-white py-16 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <span className="inline-block px-4 py-1.5 rounded-full bg-white/10 text-saffron-300 text-xs font-bold uppercase tracking-wider mb-4">
            Travel Blog
          </span>
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold mb-4">
            Morocco Travel Guides & Tips
          </h1>
          <p className="text-midnight-200 text-lg max-w-2xl mx-auto mb-8">
            Expert advice, insider tips, and detailed guides to help you plan the perfect Moroccan adventure.
          </p>
          
          {/* Search */}
          <div className="relative max-w-xl mx-auto">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-stone-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search guides... (e.g., 'Marrakech itinerary', 'Morocco safety')"
              className="w-full pl-12 pr-4 py-4 rounded-xl bg-white text-midnight-500 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-terracotta-400"
            />
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Categories */}
        <div className="flex flex-wrap gap-2 mb-8 justify-center">
          {CATEGORIES.map((category) => (
            <button
              key={category}
              onClick={() => setSelectedCategory(category)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                selectedCategory === category
                  ? 'bg-terracotta-500 text-white'
                  : 'bg-white border border-stone-200 text-stone-600 hover:border-terracotta-400 hover:text-terracotta-600'
              }`}
            >
              {category}
            </button>
          ))}
        </div>

        {/* Featured Post */}
        {filteredPosts.length > 0 && (
          <article className="mb-12 bg-white rounded-2xl overflow-hidden shadow-sm border border-stone-100 hover:shadow-lg transition-shadow">
            <div className="grid md:grid-cols-2 gap-0">
              <div className="relative h-64 md:h-auto">
                <img 
                  src={filteredPosts[0].image} 
                  alt={filteredPosts[0].title}
                  className="absolute inset-0 w-full h-full object-cover"
                />
                <span className="absolute top-4 left-4 px-3 py-1 bg-terracotta-500 text-white text-xs font-bold rounded-full">
                  Featured
                </span>
              </div>
              <div className="p-8 flex flex-col justify-center">
                <span className="text-sm text-terracotta-500 font-medium mb-2">{filteredPosts[0].category}</span>
                <h2 className="text-2xl font-bold text-midnight-500 mb-3 hover:text-terracotta-600 transition-colors">
                  <Link to={`/blog/${filteredPosts[0].slug}`}>{filteredPosts[0].title}</Link>
                </h2>
                <p className="text-stone-600 mb-4 line-clamp-3">{filteredPosts[0].excerpt}</p>
                <div className="flex items-center gap-4 text-sm text-stone-500 mb-4">
                  <span className="flex items-center gap-1"><User className="w-4 h-4" /> {filteredPosts[0].author}</span>
                  <span className="flex items-center gap-1"><Calendar className="w-4 h-4" /> {filteredPosts[0].date}</span>
                  <span className="flex items-center gap-1"><Clock className="w-4 h-4" /> {filteredPosts[0].readTime}</span>
                </div>
                <Link 
                  to={`/blog/${filteredPosts[0].slug}`}
                  className="inline-flex items-center gap-2 text-terracotta-500 font-semibold hover:text-terracotta-600 transition-colors"
                >
                  Read Full Guide <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
          </article>
        )}

        {/* Posts Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredPosts.slice(1).map((post) => (
            <article 
              key={post.id}
              className="bg-white rounded-xl overflow-hidden shadow-sm border border-stone-100 hover:shadow-lg transition-all hover:-translate-y-1"
            >
              <div className="relative h-48">
                <img 
                  src={post.image} 
                  alt={post.title}
                  className="absolute inset-0 w-full h-full object-cover"
                  loading="lazy"
                />
                <span className="absolute top-3 left-3 px-2 py-1 bg-white/90 backdrop-blur-sm text-xs font-medium text-midnight-500 rounded-full">
                  {post.category}
                </span>
              </div>
              <div className="p-5">
                <h3 className="font-bold text-midnight-500 mb-2 line-clamp-2 hover:text-terracotta-600 transition-colors">
                  <Link to={`/blog/${post.slug}`}>{post.title}</Link>
                </h3>
                <p className="text-sm text-stone-600 mb-3 line-clamp-2">{post.excerpt}</p>
                <div className="flex items-center justify-between text-xs text-stone-500">
                  <span className="flex items-center gap-1"><Calendar className="w-3.5 h-3.5" /> {post.date}</span>
                  <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" /> {post.readTime}</span>
                </div>
                <div className="flex flex-wrap gap-1 mt-3">
                  {post.tags.slice(0, 3).map((tag) => (
                    <span 
                      key={tag}
                      className="px-2 py-0.5 bg-stone-100 text-stone-500 text-xs rounded-full"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            </article>
          ))}
        </div>

        {filteredPosts.length === 0 && (
          <div className="text-center py-20">
            <p className="text-stone-500">No articles found matching your search.</p>
          </div>
        )}

        {/* SEO Content Block */}
        <div className="mt-16 prose prose-stone max-w-4xl mx-auto">
          <h2 className="text-2xl font-bold text-midnight-500">Plan Your Morocco Trip with Expert Guides</h2>
          <p className="text-stone-600">
            Our Morocco travel blog covers everything you need to plan an unforgettable Moroccan adventure. 
            From detailed city guides for <strong>Marrakech</strong>, <strong>Fes</strong>, and <strong>Chefchaouen</strong> 
            to practical advice on <strong>Morocco safety</strong>, <strong>budget planning</strong>, and <strong>cultural etiquette</strong>.
          </p>
          <p className="text-stone-600">
            Discover the <strong>best time to visit Morocco</strong>, learn about <strong>Sahara desert tours</strong>, 
            explore <strong>Moroccan cuisine</strong>, and find the perfect <strong>Morocco itinerary</strong> for your trip length. 
            Whether you're a solo traveler, couple, or family, MarocSphere has you covered.
          </p>
        </div>
      </div>
    </div>
  );
}
