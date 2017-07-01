var docks = ["top", ["right", "left"], "bottom", ["left", "right"], "right"];
var tooltipTriggers = Array.prototype.slice.apply(document.querySelectorAll(".tooltip-trigger"));
tooltipTriggers.forEach(function(element, idx) {
    var dock = docks[idx];
    console.log("Hello " + dock);
    var tooltip;
    element.addEventListener("mouseover", function() {
        var options = {
            alignTo: element,
            dock: dock
        };
        if (idx === 4) {
            options.content = "<span>This text is bold and italic: <b><i>1337</i></b></span>"
        }
        tooltip = leonardoui.tooltip(options);
    });
    element.addEventListener("mouseout", function() {
        if (tooltip) {
            tooltip.close();
        }
    });
});