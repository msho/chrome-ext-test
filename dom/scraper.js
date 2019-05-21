class Scraper {
    static isLabelFieldExist(strLabelText) {
        return getLabelField(strLabelText) !== null;
    } // isLabelFieldExist

    static getLabelField(strLabelText) {
        let domLabels = document.querySelectorAll('#ntdetid .dt-field-label');
        for (let domLabel of domLabels) {
            if (domLabel.innerText === strLabelText) 
                return domLabel;
        }

        // not found
        return null;
    } // getLabelField

} // Scraper class
