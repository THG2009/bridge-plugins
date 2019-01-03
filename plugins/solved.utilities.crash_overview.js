Bridge.registerPlugin({
    author: "solvedDev",
    version: "1.0.0",
    name: "Crash Indicator",
    description: "Displays which entities may cause crashes."
});

let potential_problems = [
    "minecraft:spell_effects",
    "behavior.send_event",
    "behavior.dragon",
    "minecraft:peek"
];

function loadProject(cb) {
    Bridge.FS.readDirectory("entities", (err, files) => {
        if(err) console.warn(err);

        let total = 0;
        let list = [];
        files.forEach(file => {
            Bridge.FS.readFile("entities/" + file, (err, data) => {
                if(err) console.warn(err);
                
                let content = data.toString();
                potential_problems.forEach(problem => {
                    if(content.includes(problem)) {
                        list.push({
                            type: problem,
                            file: file.toLowerCase()
                        });
                    }
                });

                total++;
                if(total >= files.length) {
                    if(cb) cb(list);
                }
            });
        });
    });
    return "Loading...";
}

let search = "";

function initialLoad(register=true) {
    loadProject((list) => { 
        let content = [
            {  
                type: "horizontal",
                content: [
                    {  
                        type: "input",
                        text: "Search...",
                        action(val) {
                            search = val;
                            initialLoad(false);
                        }
                    }
                ]
            },
            {
                text: "\n"
            }
        ];
        if(list.length > 0) {
            let el = [];
            for(let e of list.filter(e => e.type.includes(search) || e.file.includes(search))) {
                el.push({ text: e.type, color: "error" });
                el.push({ text: `\n${e.file}`.replace(/\.json/g, ""), color: "yellow" });
                el.push({ text: ".json\n", color: "orange" });
                el.push({ type: "divider" });
            }
            if(el.length == 0) content.push({ text: `No results found for "${search}"` });
            content.push(...el);
            content.push({ type: "divider" }, { type: "divider" });
            content.push({ text: "\nTotal: ", color: "success" }, { text: el.length/4 });
        } else {
            content.push({ text: "No potential crashes found!", color: "success" });
        }
        
        
    
        if(register) {
            Bridge.Sidebar.register({
                id: "solved-crash-indicator-sidebar",
                title: "Crash Indicator",
                icon: "error",
                toolbar: [
                    {
                        display_icon: "refresh",
                        action() {
                            initialLoad(false);
                        }
                    }
                ],
                content
            });

            //FOOTER LOGIC
            if(list.length > 0) {
                Bridge.Footer.register({
                    display_name: `${list.length} potential crashes`,
                    display_icon: "error",
                    id: "solved-crash-indicator-footer",
                    badge: {
                        color: "error",
                        content: list.length
                    },
        
                    action() {
                        Bridge.Sidebar.open("solved-crash-indicator-sidebar");
                        Bridge.Footer.remove("solved-crash-indicator-footer");
                    }
                });
                Bridge.on("opened-sidebar", (sidebar_id) => {
                    if(sidebar_id == "solved-crash-indicator-sidebar") {
                        Bridge.Footer.remove("solved-crash-indicator-footer");
                    }
                });
            }
        } else {
            Bridge.Sidebar.update({
                id: "solved-crash-indicator-sidebar",
                content
            });
        }
    });
}

initialLoad();
