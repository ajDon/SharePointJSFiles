function adjustPromotedLinks(numberOfLinksPerRow) {

    numberOfLinksPerRow = numberOfLinksPerRow || 6;
    // local variables
    var pre = "<tr><td><div class='ms-promlink-body' id='promlink_row_",
        post = "'></div></td></tr>",
        numberOfLinksInCurrentRow = numberOfLinksPerRow,
        currentRow = 1,
    // find the number of promoted links we're displaying
        numberOfPromotedLinks = jQuery('.ms-promlink-body > .ms-tileview-tile-root').length;
    // if we have more links then we want in a row, let's continue
    if (numberOfPromotedLinks > numberOfLinksPerRow) {
        // we don't need the header anymore, no cycling through links
        jQuery('.ms-promlink-root > .ms-promlink-header').empty();
        // let's iterate through all the links after the maximum displayed link
        for (i = numberOfLinksPerRow + 1; i <= numberOfPromotedLinks; i++) {
            // if we're reached the maximum number of links to show per row, add a new row
            // this happens the first time, with the values set initially
            if (numberOfLinksInCurrentRow == numberOfLinksPerRow) {
                // i just want the 2nd row to
                currentRow++;
                // create a new row of links
                jQuery('.ms-promlink-root > table > tbody:last').append(pre + currentRow + post);
                // reset the number of links for the current row
                numberOfLinksInCurrentRow = 0
            }
            // move the Nth (numberOfLinksPerRow + 1) div to the current table row    
            jQuery('#promlink_row_' + currentRow).append(
                jQuery('.ms-promlink-body > .ms-tileview-tile-root:eq(' + (numberOfLinksPerRow) + ')')
            );
            numberOfLinksInCurrentRow++;
        }
    }
  }