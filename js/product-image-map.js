/**
 * Product Image Mapping
 * 产品图片映射配置文件
 * 
 * 使用方法：
 * 1. 在HTML中引入此文件: <script src="js/product-image-map.js"></script>
 * 2. 在其他JS文件中使用: getProductImage(productName)
 * 
 * 注意：产品名称必须完全匹配（不区分大小写）才会显示对应图片
 */

// Product image mapping - maps product names to images in product folder
// Only exact matches will be used
const productImageMap = {
   // Ban Heang
'bh sotong cuttlefish': '../product/BH Sotong Cuttlefish.png',
'bh gula sotong cuttlefish': '../product/BH Gula Sotong Cuttlefish.png',
'bh salted fish crisp': '../product/BH Salted Fish Crisp.png',
'bh satay fish': '../product/BH Satay Fish.png',
'bh sakura shrimp': '../product/BH Sakura Shrimp.png',
'bh durian mochi': '../product/BH Durian Mochi.png',
'bh durian crisp': '../product/BH Durian Crisp.png',
'bh durian pudding': '../product/BH Durian Pudding.png',
'bh freeze dried durian 50g': '../product/BH Freeze Dried Durian 50g.png',
'bh freeze dried durian 30g': '../product/BH Freeze Dried Durian 30g.jpg',
'bh freeze dried jackfruit 30g': '../product/BH Freeze Dried Jackfruit 30g.jpg',
'bh durian beh teh saw': '../product/BH Durian Beh Teh Saw.png',
'bh tau shar pheah durian': '../product/BH Tau Shar Pheah Durian.png',
'bh dried mango': '../product/BH Dried Mango.png',
'bh freeze dried mango 50g': '../product/BH Freeze Dried Mango 50g.png',
'bh freeze dried mango 30g': '../product/BH Freeze Dried Mango 30g.webp',
'bh mochi milk mango filling': '../product/BH Mochi Milk Mango Filling.png',
'bh frugurt yogurt mango': '../product/BH Frugurt Yogurt Mango.png',
'bh coconut biscuits': '../product/BH Coconut Biscuits.png',
'bh coconut crisp': '../product/BH Coconut Crisp.webp',
'bh coconut pudding': '../product/BH Coconut Pudding.png',
'bh white coffee mini': '../product/BH White Coffee Mini.png',
'bh white coffee no sugar mini': '../product/BH White Coffee NS Mini.png',
'bh durian white coffee min': '../product/BH Durian White Coffee Mini.png',
'bh teh tarik mini': '../product/BH Teh Tarik Mini.png',
'bh tau shar pheah white coffee': '../product/BH Tau Shar Pheah White Coffee.png',
'bh chocolate cookies': '../product/BH Chocolate Cookies.png',
'bh omelette crisp chocolate': '../product/BH Omelette Crisp Chocolate.png',
'bh green tea mochi': '../product/BH Green Tea Mochi.webp',
'bh mochi milk green tea': '../product/BH Mochi Milk Green Tea.png',
'bh mochi milk yam filling': '../product/BH Mochi Milk Yam Filling.png',
'bh yam mochi': '../product/BH Yam Mochi.png',
'bh peanut mochi': '../product/BH Peanut Mochi.png',
'bh red bean mochi': '../product/BH Red Bean Mochi.png',
'bh tau sar pheah': '../product/BH Tau Sar Pheah.png',
'bh tau sar pheah spicy shrimp': '../product/BH Tau Sar Pheah Spicy Shrimp.png',
'bh tau shar pheah almond': '../product/BH Tau Shar Pheah Almond.png',
'bh tau shar pheah cempedak': '../product/BH Tau Shar Pheah Cempedak.png',
'bh tau shar pheah cheese': '../product/BH Tau Shar Pheah Cheese.png',
'bh tau shar pheah matcha': '../product/BH Tau Shar Pheah Matcha.png',
'bh tau shar pheah original': '../product/BH Tau Shar Pheah Original.png',
'bh tau shar pheah paprika seaweed': '../product/BH Tau Shar Pheah Paprika Seaweed.png',
'bh tau shar pheah salted egg': '../product/BH Tau Shar Pheah Salted Egg.png',
'bh heong pheah': '../product/BH Heong Pheah.png',
'bh phong pheah': '../product/BH Phong Pheah.png',
'bh hup toh soh': '../product/BH Hup Toh Soh.png',
'bh almond cookies': '../product/BH Almond Cookies.png',
'bh almond slice': '../product/BH Almond Slice.png',
'bh almond slice salted egg': '../product/BH Almond Slice Salted Egg.webp',
'bh butter cookies': '../product/BH Butter Cookies.png',
'bh raisin cookies': '../product/BH Raisin Cookies.png',
'bh pepper biscuit': '../product/BH Pepper Biscuit.png',
'bh kai chai biscuit': '../product/BH Kai Chai Biscuit.png',
'bh gula kacang': '../product/BH Gula Kacang.png',
'bh black sesame peanut': '../product/BH Black Sesame Peanut.png',
'bh tambun original': '../product/BH Tambun Original.png',
'bh tambun pandan': '../product/BH Tambun Pandan.png',
'bh tambun white lotus': '../product/BH Tambun White Lotus.png',
'bh salted egg crisp': '../product/BH Salted Egg Crisp.png',
'bh omelette crisp pandan': '../product/BH Omelette Crisp Pandan.png',
'bh freeze dried strawberry 20g': '../product/BH Freeze Dried Strawberry 20g.jpg',
'bh freeze dried cempedak 25g': '../product/BH Freeze Dried Cempedak 25g.jpg',
'bh frugurt yogurt blueberry': '../product/BH Frugurt Yogurt Blueberry.png',
'bh frugurt yogurt peach': '../product/BH Frugurt Yogurt Peach.png',
'bh pineapple tart': '../product/BH Pineapple Tart.png',
'bh ginger slice': '../product/BH Ginger Slice.png',
'bh fillet cracker with anchovy': '../product/BH Fillet Cracker With Anchovy.jpg',
'bh fillet cracker with seaweed': '../product/BH Fillet Cracker With Seaweed.png',
'bh shopping bag': '../product/bh shopping bag.jpg',
'bh cheese crisp': '../product/bh cheese crisp.png',
'bh shat kek ma': '../product/bh shat kek ma.png',
'bh shat kek ma (brown sugar)': '../product/bh shat kek ma (bs).png',

// Hoe Hup
'hh durian cookies': '../product/HH Durian Cookies.png',
'hh durian tart': '../product/HH Durian Tart.png',
'hh durian wafer roll': '../product/HH Durian Wafer Roll.jpg',
'hh omelette crisp durian': '../product/HH Omelette Crisp Durian.png',
'hh dodol durian': '../product/HH Dodol Durian.png',
'hh mango tart': '../product/HH Mango Tart.png',
'hh mango wafer roll': '../product/HH Mango Wafer Roll.jpg',
'hh dried fruit mango': '../product/HH Dried Fruit Mango.jpg',
'hh coconut ori cookies': '../product/HH Coconut Ori Cookies.png',
'hh coconut pandan cookies': '../product/HH Coconut Pandan Cookies.png',
'hh dodol kopi': '../product/HH Dodol Kopi.png',
'hh dodol original': '../product/HH Dodol Original.png',
'hh cuttlefish red': '../product/hh cutterfish red.jpg',
'hh cuttlefish honey': '../product/hh cutterfish honey.jpg',
'hh cuttlefish slices': '../product/hh cutterfish slices.jpg',
'hh cuttlefish sugar': '../product/hh cutterfish sugar.jpg',
'hh cuttlefish lemon': '../product/hh cutterfish lemon.jpg',
'hh cuttlefish floss original': '../product/hh cutterfish floss.jpg',

// AD Chocolate
'ad chocolate original': '../product/Sabah Tea Chocolate Ori.jpg',
'ad chocolate durian': '../product/AD Chocolate Durian.jpg',
'ad chocolate coconut': '../product/AD Chocolate Coconut.jpg',
'ad chocolate dark': '../product/AD Chocolate Dark.jpg',
'ad chocolate rambutan': '../product/AD Chocolate Rambutan.jpg',
'ad chocolate sabah tea': '../product/AD Chocolate Sabah Tea.jpg',
'ad chocolate tiramisu': '../product/AD Chocolate Tiramisu.jpg',
'ad chocolate mango': '../product/AD Chocolate Mango.jpg',
'ad chocolate mangosteen': '../product/AD Chocolate Mangosteen.jpg',
'ad chocolate banana': '../product/AD Chocolate Banana.jpg',
'ad chocolate coffee': '../product/AD Chocolate Coffee.jpg',
    
// Sabah Tea
'sabah tea small (25pax)': '../product/sabah tea small.png',
'sabah tea big (50pax)': '../product/sabah tea big.png',
'sabah tea wooden (small)': '../product/sabah tea wooden small.png',
'sabah tea wooden (big)': '../product/sabah tea wooden big.png',
'sabah tea gift box': '../product/sabah tea gift box.png',
'sabah tea gift box (long)': '../product/sabah tea gift box long.png',
'sabah tea tongkat ali': '../product/sabah tea tongkat ali.png',
'sabah tea lemongrass': '../product/sabah tea lemongrass.png',
'sabah tea kalamansi': '../product/sabah tea kalamansi.png',
'sabah tea mango': '../product/sabah tea mango.png',
'sabah tea cinnamon': '../product/sabah tea cinnamon.png',
'sabah tea camomile': '../product/sabah tea camomile.png',
'sabah tea vanilla': '../product/sabah tea vanilla.png',
'sabah tea peppermint': '../product/sabah tea peppermint.png',
'sabah tea lavender': '../product/sabah tea lavender.png',
'sabah tea earl grey': '../product/sabah tea earl grey.png',
'sabah tea lemon': '../product/sabah tea lemon.png',
'sabah tea geranium': '../product/sabah tea geranium.png',
'sabah tea jasmine': '../product/sabah tea jasmine.png',
'sabah tea strawberry': '../product/sabah tea strawberry.png',
'sabah tea pandan': '../product/sabah tea pandan.png',
'sabah tea organic': '../product/sabah tea organic.png',
'sabah tea ginger': '../product/sabah tea ginger.png',
'sabah tea teh tarik (yellow)': '../product/Sabah Tea Teh Tarik Yellow.png',
'sabah tea teh tarik (green)': '../product/Sabah Tea Teh Tarik Green.png',
'sabah tea (sebuk) 400g': '../product/sabah tea sebuk 400g.png',
'sabah tea misai kucing': '../product/sabah tea misai kucing.png',
'sabah tea passionfruit': '../product/sabah tea passionfruit.png',
'sabah tea rose': '../product/sabah tea rose.png',
'sabah tea hibiscus': '../product/sabah tea hibiscus.png',
'sabah tea rasberry': '../product/sabah tea raspberry.png',
'sabah tea peach': '../product/sabah tea peach.png',

// Seafood
'slipper lobster': '../product/Slipper Lobster.png',
'king lobster': '../product/King Lobster.png',
'flower prawn': '../product/Flower Prawn.png',
'tiger prawn': '../product/Tiger Prawn.png',
'yellow prawn': '../product/Yellow Prawn.png',
'black empurau': '../product/Black Empurau.png',
'scallop': '../product/Scallop.png',
'conch meat': '../product/Conch Meat.png',
'crab meat': '../product/Crab Meat.png',
'abalone': '../product/Abalone.png',
'cuttlefish sugar': '../product/Cuttlefish Sugar.png',
'cuttlefish slices': '../product/Cuttlefish Slices.png',
'cuttlefish floss original': '../product/Cuttlefish Floss Original.png',
'hh five star cuttlefish': '../product/Five Star Cuttlefish.png',
'sotong kering': '../product/Sotong Kering.webp',
'hh salted egg fish skin': '../product/Salted Egg Fish Skin.png',
'hh salted egg fish skin spicy': '../product/Salted Egg Fish Skin Spicy.png',
'hh salted egg fish chips': '../product/Salted Egg Fish Chips.png',
'hh salted egg fish chips mala': '../product/Salted Egg Fish Chips Mala.png',
'hh fish chips classic': '../product/Fish Chips Classic.png',
'hh salted egg salmon skin': '../product/Salted Egg Salmon Skin.png',
'hh salted egg salmon skin spicy': '../product/Salted Egg Salmon Skin Spicy.png',
'ikan bilis mata biru': '../product/Ikan Bilis Mata Biru.png',
'ikan bilis kopek': '../product/Ikan Bilis Kopek.png',
'anchovy red': '../product/Anchovy Red.jpg',
'anchovy yellow': '../product/Anchovy Yellow.jpg',
'udang kering': '../product/Udang Kering.png',
'kerapu tikus': '../product/Kerapu Tikus.png',
'telur ikan': '../product/Telur Ikan.png',
'anchovy blue': '../product/anchovy blue.png',
'anchovy green': '../product/anchovy green.png',
    
// Spritzer
'spritzer 250ml': '../product/spritzer 250ml.jpg',
'spritzer 550ml': '../product/spritzer 550ml.jpeg',
'spritzer 750ml': '../product/spritzer 750ml.jpg',
    
// Office
'mango gummy': '../product/mango gummy.jpg',
'dried mango (office)': '../product/dried mango office.jpg',
'rempeyek': '../product/Rempeyek.jpg',
'kerepek pisang manis': '../product/KP Manis.jpg',
'kerepek pisang masin': '../product/KP Masin.jpg',
'kerepek ubi belado': '../product/Kerepek Ubi Belado.jpg',
'kuih cacap (s)': '../product/Kuih Cacap (S).jpg',
'kuih cacap (b)': '../product/Kuih Cacap (b).jpg',
'kuih lidah chocolate': '../product/kuih lidah chocolate.jpg',
'kuih lidah cheese': '../product/kuih lidah cheese.jpg',
'kuih lidah durian': '../product/kuih lidah durian.jpg',
'kuih cincin (b)': '../product/Kuih cincin big.jpg',
'kuih cincin (s)': '../product/kuih cincin small.jpg',



// Other
'durian milk candy': '../product/Durian milk candy.jpg',
'durian kuih': '../product/Durian Kuih.jpg',
'kuih cincin mini': '../product/kuih cincin mini.jpg',
'dried mango': '../product/Dried Mango.png',
'coconut cookies': '../product/HH Coconut Ori Cookies.png',
'bh coconut chip 50g': '../product/Coconut Chip 50g.jpg',
'coconut milk candy': '../product/Coconut milk candy.jpg',
'coconut peanut candy': '../product/Peanut Candy Coconut.jpg',
'coffee peanut candy': '../product/Peanut Candy Coffee.jpg',
'kopi tenom blue': '../product/Kopi Tenom Blue.png',
'kopi tenom gold': '../product/Kopi Tenom Gold.png',
'kopi tenom green': '../product/Kopi Tenom Green.webp',
'kopi tenom red': '../product/Kopi Tenom Red.webp',
'kopi tenom silver': '../product/Kopi Tenom Silver.webp',
'sabah tea chocolate ori': '../product/Sabah Tea Chocolate Ori.jpg',
'sabah tea chocolate durian': '../product/Sabah Tea Chocolate Durian.jpg',
'sabah tea chocolate mangosteen': '../product/Sabah Tea Chocolate Mangosteen.jpg',
'sabah tea chocolate tenom kopi': '../product/Sabah Tea Chocolate Tenom kopi.jpg',
'green tea mochi': '../product/BH Green Tea Mochi.webp',
'sesame peanut candy': '../product/Peanut Candy Sesame.jpg',
'durian peanut candy': '../product/Peanut Candy Durian.jpg',
'amplang sotong': '../product/Amplang Sotong.jpg',
'amplang cheese': '../product/Amplang Cheese.jpg',
'amplang pandan': '../product/Amplang Pandan.jpg',
'amplang tomyum': '../product/Amplang Tomyum.jpg',
'amplang udang': '../product/Amplang Udang.jpg',
'amplang ikan': '../product/Amplang Ikan.jpg',
'fruity gummy mango': '../product/Fruity Gummy Mango.png',
'fruity gummy assorted': '../product/Fruity Gummy Assorted.png',
'sour gummy apple': '../product/Sour Gummy Apple.png',
'sour gummy blackcurrant': '../product/Sour Gummy Blackcurrant.png',
'assorted candy mix': '../product/Assorted candy.webp',
'assorted jelly mix': '../product/Assorted jelly.webp',
'sabah bird nest candy': '../product/Bird Nest Candy.jpg',
'kua chi lap': '../product/Kua Chi Lap.png',
'hoi li': '../product/Hoi Li.png',
'sunoh': '../product/Sunoh.png',
'wrapping machine': '../product/Wrapping Machine.png',
'wrapping mini': '../product/Wrapping Mini.png'
};

/**
 * Get product image - only exact matches
 * 获取产品图片 - 仅精确匹配
 * @param {string} productName - 产品名称
 * @returns {string} - 图片路径或默认图标路径
 */
function getProductImage(productName) {
    if (!productName) return '../icons/pos.png';
    
    // Convert to lowercase for matching
    const lowerProductName = productName.toLowerCase().trim();
    
    // Only try exact match - no partial matching
    if (productImageMap[lowerProductName]) {
        console.log(`✅ Exact match found for "${productName}": ${productImageMap[lowerProductName]}`);
        return productImageMap[lowerProductName];
    }
    
    // Log when no exact match is found
    console.log(`❌ No exact image match found for product: "${productName}"`);
    
    // Return fallback icon
    return '../icons/pos.png';
}

/**
 * Show available image mappings for debugging
 * 显示可用的图片映射（用于调试）
 */
function showAvailableImageMappings() {
    console.log('📋 Available image mappings:');
    console.log('To display images, product names must exactly match these keys:');
    Object.keys(productImageMap).forEach(key => {
        console.log(`  "${key}" -> ${productImageMap[key]}`);
    });
    console.log('Total available mappings:', Object.keys(productImageMap).length);
}

/**
 * Test function to verify image loading
 * 测试图片加载的函数
 */
function testImageLoading() {
    const testImg = new Image();
    testImg.onload = function() {
        console.log('✅ Test image loaded successfully: ../product/Slipper Lobster.png');
    };
    testImg.onerror = function() {
        console.log('❌ Test image failed to load: ../product/Slipper Lobster.png');
    };
    testImg.src = '../product/Slipper Lobster.png';
}

// Export functions for global use
// 导出函数供全局使用
window.getProductImage = getProductImage;
window.showAvailableImageMappings = showAvailableImageMappings;
window.testImageLoading = testImageLoading;
window.productImageMap = productImageMap;


