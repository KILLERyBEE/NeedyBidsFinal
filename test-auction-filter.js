// Test script to check auction filtering
console.log('🧪 Testing Auction Filter Logic...');

// Test the filtering logic
function testAuctionTypeFilter() {
    const testItems = [
        { auctionType: 'Reserve', title: 'Item 1' },
        { auctionType: 'No Reserve', title: 'Item 2' },
        { auctionType: 'reserve', title: 'Item 3' },
        { auctionType: 'no reserve', title: 'Item 4' },
        { auctionType: 'No-Reserve', title: 'Item 5' },
        { auctionType: 'RESERVE', title: 'Item 6' },
        { auctionType: 'NO RESERVE', title: 'Item 7' }
    ];

    console.log('\n📋 Test Items:');
    testItems.forEach(item => {
        console.log(`- ${item.title}: "${item.auctionType}"`);
    });

    // Test the current filtering logic
    function filterItems(items, filterType) {
        return items.filter(item => {
            if (!item.auctionType) return false;
            
            const itemType = item.auctionType.toLowerCase().replace(/\s+/g, '').replace(/-/g, '');
            const filterTypeClean = filterType.toLowerCase().replace(/\s+/g, '').replace(/-/g, '');
            
            console.log(`  Comparing: "${item.auctionType}" -> "${itemType}" vs "${filterType}" -> "${filterTypeClean}"`);
            
            if (filterTypeClean === 'reserve' && itemType !== 'reserve') return false;
            if (filterTypeClean === 'no-reserve' && itemType !== 'noreserve') return false;
            
            return true;
        });
    }

    console.log('\n🔍 Testing Reserve Filter:');
    const reserveItems = filterItems(testItems, 'reserve');
    console.log('Reserve items found:', reserveItems.map(item => item.title));

    console.log('\n🔍 Testing No Reserve Filter:');
    const noReserveItems = filterItems(testItems, 'no-reserve');
    console.log('No Reserve items found:', noReserveItems.map(item => item.title));

    console.log('\n✅ Test completed!');
}

// Run the test
testAuctionTypeFilter();

console.log('\n📝 Expected behavior:');
console.log('- Reserve filter should only show items with auctionType: "Reserve"');
console.log('- No Reserve filter should only show items with auctionType: "No Reserve"');
console.log('- The filtering should be case-insensitive and handle spaces/hyphens');
