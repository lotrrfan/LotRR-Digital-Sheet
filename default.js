// ==========================================
// 1. MEMORY ENGINE & INITIALIZATION
// ==========================================
let isEditMode = false;
let currentRollTargetId = null;
let currentRollProfState = 0; 
let currentPageIndex = 0;
const pageIds = ['page-1', 'page-2', 'page-3', 'page-4', 'page-5'];

function bindSheetInput(input) {
    if (input.dataset.bound) return; 
    input.dataset.bound = 'true';

    if (!input.classList.contains('live-box') && input.tagName !== 'SELECT') {
        input.readOnly = !isEditMode; 
    }
    
    input.addEventListener('focus', () => {
        if (!isEditMode && !input.classList.contains('live-box')) {
            input.blur();
        }
    });
    
    if (input.id !== "Name" && input.id !== "P2-Name" && !input.classList.contains('backstory-line')) {
        const savedVal = localStorage.getItem("lotrr_" + input.id);
        if (savedVal !== null) {
            input.value = savedVal;
            if(input.id === 'Speed') {
                input.setAttribute('data-base-speed', savedVal.replace(/\s*\(\-\d+\)/, ''));
            }
        } else if (input.id === 'Speed') {
            input.setAttribute('data-base-speed', input.value.replace(/\s*\(\-\d+\)/, ''));
        }
    }

    input.addEventListener('input', () => {
        // Name Sync P1 & P2
        if (input.id === 'Name') {
            const p2 = document.getElementById('P2-Name');
            if (p2) { p2.value = input.value; localStorage.setItem("lotrr_P2-Name", input.value); if (typeof fitText === "function") fitText(p2); }
        } else if (input.id === 'P2-Name') {
            const p1 = document.getElementById('Name');
            if (p1) { p1.value = input.value; localStorage.setItem("lotrr_Name", input.value); if (typeof fitText === "function") fitText(p1); }
        }

        // Shadow Sync P1 & P4
        if (input.id === 'ShadowScore') {
            const other = document.getElementById('shadowScore');
            if (other) { other.value = input.value; localStorage.setItem('lotrr_shadowScore', input.value); }
            calculateShadow();
        } else if (input.id === 'shadowScore') {
            const other = document.getElementById('ShadowScore');
            if (other) { other.value = input.value; localStorage.setItem('lotrr_ShadowScore', input.value); }
            calculateShadow();
        } else if (input.id === 'ShadowScars') {
            const other = document.getElementById('shadowScars');
            if (other) { other.value = input.value; localStorage.setItem('lotrr_shadowScars', input.value); }
            calculateShadow();
        } else if (input.id === 'shadowScars') {
            const other = document.getElementById('ShadowScars');
            if (other) { other.value = input.value; localStorage.setItem('lotrr_ShadowScars', input.value); }
            calculateShadow();
        }

        if (input.id === 'Speed') {
            input.setAttribute('data-base-speed', input.value.replace(/\s*\(\-\d+\)/, ''));
            localStorage.setItem("lotrr_Speed", input.getAttribute('data-base-speed'));
        } else if (!input.classList.contains('backstory-line') && !input.classList.contains('auto-calc')) {
            localStorage.setItem("lotrr_" + input.id, input.value);
        }
        
        if (input.id === "ExpPoints" || input.id === "Culture") calculateLevel();
        if (["Str", "Dex", "Con", "Int", "Wis", "Cha"].includes(input.id)) calculateModifier(input.id);

        if (input.classList.contains('weight-trigger') || input.id === 'Str' || input.id.startsWith('Feature-') || input.id === 'Speed') {
            calculateWeight();
        }
        
        if (input.id.toLowerCase().includes('shadow') || input.id === 'Wis') {
            calculateShadow();
        }

        if (input.id.startsWith('CompanyMember-') || input.id.startsWith('JourneyRole-')) {
            evaluateJourneyRoles();
        }

        if (input.id === 'notes') {
            evaluateBandTab();
        }

        // Live Ally Sync trigger
        if (input.id.startsWith('nameAlly')) {
            pullAllyDataToBand(input.id.replace('nameAlly', ''));
            evaluateBandTab();
        } else if (input.id.startsWith('Ally') && input.id.endsWith('name')) {
            let match = input.id.match(/^Ally(\d+)name$/);
            if (match) pushAllyDataToBand(match[1]);
            evaluateBandTab();
        }

        if (input.id !== "Journal" && !input.classList.contains('backstory-line') && !input.id.startsWith('JourneyRole-') && !input.id.startsWith('AbilityCheck-') && typeof fitText === "function") {
            fitText(input);
        }
    });
    
    if (input.tagName === 'SELECT') {
        input.addEventListener('change', () => {
            localStorage.setItem("lotrr_" + input.id, input.value);
            evaluateJourneyRoles();
        });
    }
}

document.addEventListener("DOMContentLoaded", () => {
    
    const savedAddress = localStorage.getItem("encounterPlusAddress");
    if (savedAddress && document.getElementById("ep-address-menu")) {
        document.getElementById("ep-address-menu").value = savedAddress;
    }

    const savedPortrait = localStorage.getItem("lotrr_Portrait");
    if (savedPortrait) {
        const portraitDiv = document.getElementById('Portrait');
        if(portraitDiv) portraitDiv.style.backgroundImage = `url(${savedPortrait})`;
    }

    const savedName = localStorage.getItem("lotrr_Name") || localStorage.getItem("lotrr_P2-Name");
    if (savedName !== null) {
        if(document.getElementById("Name")) document.getElementById("Name").value = savedName;
        if(document.getElementById("P2-Name")) document.getElementById("P2-Name").value = savedName;
    }
    
    const savedShadowScore = localStorage.getItem("lotrr_ShadowScore") || localStorage.getItem("lotrr_shadowScore");
    if (savedShadowScore !== null) {
        if(document.getElementById("ShadowScore")) document.getElementById("ShadowScore").value = savedShadowScore;
        if(document.getElementById("shadowScore")) document.getElementById("shadowScore").value = savedShadowScore;
    }

    const savedShadowScars = localStorage.getItem("lotrr_ShadowScars") || localStorage.getItem("lotrr_shadowScars");
    if (savedShadowScars !== null) {
        if(document.getElementById("ShadowScars")) document.getElementById("ShadowScars").value = savedShadowScars;
        if(document.getElementById("shadowScars")) document.getElementById("shadowScars").value = savedShadowScars;
    }

    let savedBlockCount = parseInt(localStorage.getItem('lotrr_allyBlockCount')) || 1;
    for (let i = 2; i <= savedBlockCount; i++) {
        addAllyBlock(true); 
    }

    document.querySelectorAll('.sheet-input').forEach(input => {
        bindSheetInput(input);
        if (input.id !== "Journal" && !input.classList.contains('backstory-line') && !input.id.startsWith('JourneyRole-') && !input.id.startsWith('AbilityCheck-')) {
            setTimeout(() => {
                if (typeof fitText === "function") fitText(input);
            }, 10); 
        }
    });

    document.querySelectorAll('.sheet-checkbox').forEach(box => {
        if (box.classList.contains('auto-calc')) return;
        if (box.id === "Portrait" || box.id === "Encumbered" || box.id === "HeavilyEncumbered") return; 

        const savedState = localStorage.getItem("lotrr_" + box.id);
        if (savedState !== null) {
            box.setAttribute('data-state', savedState);
            if (box.id === "Insp") {
                updateInspirationVisuals(box, parseInt(savedState));
            } else if (box.id.includes("Prof")) {
                updateProficiencyVisuals(box, parseInt(savedState));
            } else {
                updateCheckVisuals(box, parseInt(savedState));
            }
        }
    });

    const backstoryEditor = document.getElementById('backstory-editor');
    if (backstoryEditor) {
        backstoryEditor.addEventListener('input', function() {
            const warning = document.getElementById('backstory-warning');
            if(!warning) return;
            const breaks = (this.value.match(/\n/g) || []).length;
            if (breaks >= 22) {
                warning.classList.remove('hidden');
            } else {
                warning.classList.add('hidden');
            }
        });
    }

    document.querySelectorAll('.backstory-line').forEach(el => {
        el.addEventListener('click', (e) => {
            if (isEditMode) openBackstoryModal();
        });
        el.addEventListener('touchend', (e) => {
            if (isEditMode) {
                e.preventDefault();
                openBackstoryModal();
            }
        });
    });

    initRollables(); 
    initFeatureHelp(); 
    updateIframeMap();

    // FIX 1: Run all background math instantly on load
    setTimeout(() => {
        calculateWeight();
        calculateShadow();
        evaluateJourneyRoles();
        evaluateBandTab();
        if (typeof calculateLevel === "function") calculateLevel();
        ["Str", "Dex", "Con", "Int", "Wis", "Cha"].forEach(id => {
            if (document.getElementById(id) && typeof calculateModifier === "function") {
                calculateModifier(id);
            }
        });
    }, 100);

    document.fonts.ready.then(() => {
        const savedBackstory = localStorage.getItem('lotrr_Backstory_Full');
        if(savedBackstory) distributeBackstory(savedBackstory);
    });
});

// FIX 2: Force fitText to recalculate when the device rotates to landscape
window.addEventListener('orientationchange', () => {
    setTimeout(() => {
        document.querySelectorAll('.sheet-input').forEach(input => {
            if (typeof fitText === "function" && input.id !== "Journal" && !input.classList.contains('backstory-line') && !input.id.startsWith('JourneyRole-') && !input.id.startsWith('AbilityCheck-')) {
                fitText(input);
            }
        });
    }, 300); // 300ms delay gives the browser time to finish animating the rotation
});
window.addEventListener('resize', () => {
    setTimeout(() => {
        document.querySelectorAll('.sheet-input').forEach(input => {
            if (typeof fitText === "function" && input.id !== "Journal" && !input.classList.contains('backstory-line') && !input.id.startsWith('JourneyRole-') && !input.id.startsWith('AbilityCheck-')) {
                fitText(input);
            }
        });
    }, 100); 
});


// ==========================================
// 1.5 ALLY BLOCK & PROGRESSIVE TRACKS
// ==========================================
function addAllyBlock(isLoad = false) {
    let wrapper = document.getElementById('allies-wrapper');
    if (!wrapper) return;
    
    let blockCount = wrapper.querySelectorAll('.ally-block').length;
    let nextIndex = blockCount + 1;

    let originalBlock = document.getElementById('ally-block-1');
    let newBlock = originalBlock.cloneNode(true);
    newBlock.id = 'ally-block-' + nextIndex;
    newBlock.style.marginTop = "25px";

    let offset = (nextIndex - 1) * 4;

    newBlock.querySelectorAll('[id^="Ally"]').forEach(el => {
        let match = el.id.match(/^Ally(\d+)(.*)$/);
        if(match) {
            let oldNum = parseInt(match[1]);
            let newNum = oldNum + offset;
            el.id = "Ally" + newNum + match[2];
            
            if (!isLoad) {
                if (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA') {
                    el.value = '';
                    el.style.color = '#000000';
                    el.style.textDecoration = 'none';
                } else if (el.classList.contains('sheet-checkbox')) {
                    el.setAttribute('data-state', '0');
                    updateCheckVisuals(el, 0);
                }
            }
        }
    });

    wrapper.appendChild(newBlock);
    
    if (!isLoad) {
        localStorage.setItem('lotrr_allyBlockCount', nextIndex);
        
        newBlock.querySelectorAll('.sheet-input').forEach(input => {
            bindSheetInput(input);
        });

        if (isEditMode) {
            newBlock.querySelectorAll('.sheet-input').forEach(input => {
                if (!input.classList.contains('auto-calc') && !input.classList.contains('live-box')) {
                    input.readOnly = false;
                    input.classList.add('editing-active');
                }
            });
        }
    }
}

function removeAllyBlock() {
    let wrapper = document.getElementById('allies-wrapper');
    if (!wrapper) return;
    
    let blocks = wrapper.querySelectorAll('.ally-block');
    if (blocks.length <= 1) {
        alert("You cannot remove the primary Ally sheet.");
        return;
    }
    
    let lastBlock = blocks[blocks.length - 1];
    
    lastBlock.querySelectorAll('[id^="Ally"]').forEach(el => {
        localStorage.removeItem("lotrr_" + el.id);
    });

    wrapper.removeChild(lastBlock);
    localStorage.setItem('lotrr_allyBlockCount', blocks.length - 1);
    evaluateBandTab();
}

function handleProgressiveTrack(el) {
    let matchP5 = el.id.match(/^Ally(\d+)(injuries|fatigue)(?:-(\d+))?$/);
    let matchP4 = el.id.match(/^(injuries|fatigue)(\d+)Ally(\d+)$/);
    
    let isP4 = !!matchP4;
    if (!isP4 && !matchP5) return;

    let type = isP4 ? matchP4[1] : matchP5[2];
    let allyNum = parseInt(isP4 ? matchP4[3] : matchP5[1]);
    let clickedIndex = parseInt(isP4 ? matchP4[2] : (matchP5[3] ? matchP5[3] : 1));
    
    let maxBoxes = type === 'injuries' ? 5 : 4; 

    // Lingering Injury (Box 5) is independent
    if (type === 'injuries' && clickedIndex === 5) {
        let currentState = parseInt(el.getAttribute('data-state') || '0');
        let newState = currentState === 1 ? 0 : 1;
        el.setAttribute('data-state', newState);
        localStorage.setItem("lotrr_" + el.id, newState);
        updateCheckVisuals(el, newState);
        
        triggerSync(isP4, allyNum, type);
        evaluateBandTab();
        return;
    }

    let currentState = parseInt(el.getAttribute('data-state') || '0');
    
    let nextBoxId = isP4 ? `${type}${clickedIndex + 1}Ally${allyNum}` : `Ally${allyNum}${type}${clickedIndex + 1 === 1 ? '' : '-' + (clickedIndex + 1)}`;
    let nextBox = document.getElementById(nextBoxId);
    
    let isHighest = true;
    let runLimit = type === 'injuries' ? 4 : 4; 

    if (nextBox && clickedIndex < runLimit && parseInt(nextBox.getAttribute('data-state') || '0') === 1) {
        isHighest = false;
    }

    let targetLevel = clickedIndex;
    if (currentState === 1 && isHighest) {
        targetLevel = clickedIndex - 1; 
    }

    for (let i = 1; i <= runLimit; i++) {
        let boxId = isP4 ? `${type}${i}Ally${allyNum}` : `Ally${allyNum}${type}${i === 1 ? '' : '-' + i}`;
        let box = document.getElementById(boxId);
        if (box) {
            let newState = i <= targetLevel ? 1 : 0;
            box.setAttribute('data-state', newState);
            localStorage.setItem("lotrr_" + boxId, newState);
            updateCheckVisuals(box, newState);
        }
    }

    triggerSync(isP4, allyNum, type);
    evaluateBandTab();
}

function triggerSync(fromBandTab, sourceNum, type) {
    let nameBox = document.getElementById(fromBandTab ? `nameAlly${sourceNum}` : `Ally${sourceNum}name`);
    if (!nameBox) return;
    let rawName = nameBox.value.trim().replace(/\[M\]/gi, '').replace(/\[H\]/gi, '').trim().toLowerCase();
    if (rawName === "") return;

    if (fromBandTab) {
        let savedBlockCount = parseInt(localStorage.getItem('lotrr_allyBlockCount')) || 1;
        let totalP5Allies = savedBlockCount * 4;
        for (let i = 1; i <= totalP5Allies; i++) {
            let p5NameBox = document.getElementById(`Ally${i}name`);
            if (p5NameBox && p5NameBox.value.trim().toLowerCase() === rawName) {
                copyTracks(true, sourceNum, i, type);
                break;
            }
        }
    } else {
        for (let i = 1; i <= 12; i++) {
            let p4NameBox = document.getElementById(`nameAlly${i}`);
            if (p4NameBox && p4NameBox.value.trim().replace(/\[M\]/gi, '').replace(/\[H\]/gi, '').trim().toLowerCase() === rawName) {
                copyTracks(false, i, sourceNum, type);
            }
        }
    }
}

function copyTracks(fromBandToAlly, p4Num, p5Num, type) {
    let max = type === 'injuries' ? 5 : 4;
    for(let i = 1; i <= max; i++) {
        let p4Box = document.getElementById(`${type}${i}Ally${p4Num}`);
        let p5Box = document.getElementById(`Ally${p5Num}${type}${i===1?'':'-'+i}`);
        if (p4Box && p5Box) {
            let state = parseInt((fromBandToAlly ? p4Box : p5Box).getAttribute('data-state') || '0');
            let targetBox = fromBandToAlly ? p5Box : p4Box;
            targetBox.setAttribute('data-state', state);
            localStorage.setItem("lotrr_" + targetBox.id, state);
            updateCheckVisuals(targetBox, state);
        }
    }
}

function pullAllyDataToBand(p4Num) {
    let p4NameBox = document.getElementById(`nameAlly${p4Num}`);
    if (!p4NameBox) return;
    let rawName = p4NameBox.value.trim().replace(/\[M\]/gi, '').replace(/\[H\]/gi, '').trim().toLowerCase();
    if (rawName === "") return;

    let savedBlockCount = parseInt(localStorage.getItem('lotrr_allyBlockCount')) || 1;
    let totalP5Allies = savedBlockCount * 4;
    for (let i = 1; i <= totalP5Allies; i++) {
        let p5NameBox = document.getElementById(`Ally${i}name`);
        if (p5NameBox && p5NameBox.value.trim().toLowerCase() === rawName) {
            copyTracks(false, p4Num, i, 'injuries');
            copyTracks(false, p4Num, i, 'fatigue');
            break;
        }
    }
}

function pushAllyDataToBand(p5Num) {
    let p5NameBox = document.getElementById(`Ally${p5Num}name`);
    if (!p5NameBox) return;
    let rawName = p5NameBox.value.trim().toLowerCase();
    if (rawName === "") return;

    for (let i = 1; i <= 12; i++) {
        let p4NameBox = document.getElementById(`nameAlly${i}`);
        if (p4NameBox && p4NameBox.value.trim().replace(/\[M\]/gi, '').replace(/\[H\]/gi, '').trim().toLowerCase() === rawName) {
            copyTracks(false, i, p5Num, 'injuries');
            copyTracks(false, i, p5Num, 'fatigue');
        }
    }
}

// ==========================================
// 1.8 THE MASTER BAND AUTOMATION ENGINE
// ==========================================
function evaluateBandTab() {
    let bandTotal = 0;
    let missingCount = 0;
    let deadCount = 0;
    let seriousConditionCount = 0;
    let hardenedCount = 0;

    let savedBlockCount = parseInt(localStorage.getItem('lotrr_allyBlockCount')) || 1;
    let totalP5Allies = savedBlockCount * 4;
    
    // Process Page 4 stats first so we can sync [M] formatting to Page 5
    for (let i = 1; i <= 12; i++) {
        let nameBox = document.getElementById(`nameAlly${i}`);
        if (!nameBox) continue;
        let rawName = nameBox.value.trim();
        
        if (rawName === "") {
            nameBox.style.color = '#000000';
            nameBox.style.textDecoration = 'none';
            continue;
        }

        bandTotal++; 

        let isMissing = /\[M\]/i.test(rawName);
        let isTempHardened = /\[H\]/i.test(rawName);
        let cleanName = rawName.replace(/\[M\]/gi, '').replace(/\[H\]/gi, '').trim().toLowerCase();

        let isDead = false;
        let inj4El = document.getElementById(`injuries4Ally${i}`);
        let inj4 = inj4El ? parseInt(inj4El.getAttribute('data-state') || '0') : 0;
        let inj5El = document.getElementById(`injuries5Ally${i}`);
        let inj5 = inj5El ? parseInt(inj5El.getAttribute('data-state') || '0') : 0;
        if (inj4 === 1 && inj5 === 1) isDead = true;

        if (isDead) {
            nameBox.style.color = '#d00000'; 
            nameBox.style.textDecoration = 'line-through';
        } else if (isMissing) {
            nameBox.style.color = '#808080'; 
            nameBox.style.textDecoration = 'line-through';
        } else {
            nameBox.style.color = '#000000';
            nameBox.style.textDecoration = 'none';
        }

        let isSerious = false;
        let inj3El = document.getElementById(`injuries3Ally${i}`);
        let inj3 = inj3El ? parseInt(inj3El.getAttribute('data-state') || '0') : 0;
        let fat3El = document.getElementById(`fatigue3Ally${i}`);
        let fat3 = fat3El ? parseInt(fat3El.getAttribute('data-state') || '0') : 0;
        let fat4El = document.getElementById(`fatigue4Ally${i}`);
        let fat4 = fat4El ? parseInt(fat4El.getAttribute('data-state') || '0') : 0;
        
        if (inj3 || inj4 || inj5 || fat3 || fat4) isSerious = true;

        if (isDead) deadCount++;
        else if (isMissing) missingCount++;
        else if (isSerious) seriousConditionCount++;

        if (isTempHardened) {
            hardenedCount++;
        } else {
            // Search Page 5 for hardened status
            for (let j = 1; j <= totalP5Allies; j++) {
                let p5Box = document.getElementById(`Ally${j}name`);
                if (p5Box && p5Box.value.trim().toLowerCase() === cleanName) {
                    let hBox = document.getElementById(`Ally${j}hardened`);
                    if (hBox && parseInt(hBox.getAttribute('data-state') || '0') === 1) hardenedCount++;
                    break;
                }
            }
        }
    }

    // Process Page 5 visual formatting based on Page 4 states
    for (let i = 1; i <= totalP5Allies; i++) {
        let nameBox = document.getElementById(`Ally${i}name`);
        if (!nameBox) continue;
        let rawName = nameBox.value.trim().toLowerCase();
        if (rawName === "") {
            nameBox.style.color = '#000000';
            nameBox.style.textDecoration = 'none';
            continue;
        }
        
        let p5inj4El = document.getElementById(`Ally${i}injuries-4`);
        let p5inj4 = p5inj4El ? parseInt(p5inj4El.getAttribute('data-state') || '0') : 0;
        let p5inj5El = document.getElementById(`Ally${i}injuries-5`);
        let p5inj5 = p5inj5El ? parseInt(p5inj5El.getAttribute('data-state') || '0') : 0;
        let isDead = (p5inj4 === 1 && p5inj5 === 1);
        
        let isMissing = false;
        for (let j = 1; j <= 12; j++) {
            let p4Box = document.getElementById(`nameAlly${j}`);
            if (p4Box) {
                let p4Raw = p4Box.value.trim();
                let p4Clean = p4Raw.replace(/\[M\]/gi, '').replace(/\[H\]/gi, '').trim().toLowerCase();
                if (p4Clean === rawName && /\[M\]/i.test(p4Raw)) isMissing = true;
            }
        }

        if (isDead) {
            nameBox.style.color = '#d00000';
            nameBox.style.textDecoration = 'line-through';
        } else if (isMissing) {
            nameBox.style.color = '#808080';
            nameBox.style.textDecoration = 'line-through';
        } else {
            nameBox.style.color = '#000000';
            nameBox.style.textDecoration = 'none';
        }
    }

    let readScoreBox = document.getElementById('readinessScore');
    let readModBox = document.getElementById('readinessScoreModifier');
    let dispBoxes = ['expertise', 'manoeuvre', 'rally', 'vigilance', 'war'];

    if (bandTotal === 0) {
        if(readScoreBox && readScoreBox.value !== "") { readScoreBox.value = ""; localStorage.setItem('lotrr_readinessScore', ""); }
        if(readModBox && readModBox.value !== "") { readModBox.value = ""; localStorage.setItem('lotrr_readinessScoreModifier', ""); }
        dispBoxes.forEach(id => {
            let el = document.getElementById(id);
            if(el) { 
                el.value = ""; 
                el.classList.remove('penalty-active'); 
                localStorage.setItem(`lotrr_${id}`, ""); 
            }
        });
        
        ['bandSizeSm', 'bandSizeMed', 'bandSizeLrg', 'weary'].forEach(id => {
            let el = document.getElementById(id);
            if(el) { el.setAttribute('data-state', '0'); updateCheckVisuals(el, 0); localStorage.setItem(`lotrr_${id}`, '0'); }
        });
        return; 
    }

    // Auto Readiness Math (Capped based on band size)
    let readScore = 12;
    let readMod = 1;
    if (bandTotal >= 3) {
        if (hardenedCount >= bandTotal) { readScore = 20; readMod = 5; }
        else if (hardenedCount >= Math.ceil(bandTotal / 2)) { readScore = 18; readMod = 4; }
        else if (hardenedCount >= 2) { readScore = 16; readMod = 3; }
        else if (hardenedCount === 1) { readScore = 14; readMod = 2; }
    } else {
        if (hardenedCount >= 2) { readScore = 16; readMod = 3; }
        else if (hardenedCount === 1) { readScore = 14; readMod = 2; }
    }

    if(readScoreBox && readScoreBox.value != readScore) { readScoreBox.value = readScore; localStorage.setItem('lotrr_readinessScore', readScore); }
    if(readModBox && readModBox.value !== "+" + readMod) { readModBox.value = "+" + readMod; localStorage.setItem('lotrr_readinessScoreModifier', "+" + readMod); }

    let size = "Small";
    if (bandTotal >= 9) size = "Large";
    else if (bandTotal >= 5) size = "Medium";

    let boxSm = document.getElementById('bandSizeSm');
    let boxMed = document.getElementById('bandSizeMed');
    let boxLg = document.getElementById('bandSizeLrg');
    if(boxSm) { boxSm.setAttribute('data-state', size==="Small"?1:0); updateCheckVisuals(boxSm, size==="Small"?1:0); }
    if(boxMed) { boxMed.setAttribute('data-state', size==="Medium"?1:0); updateCheckVisuals(boxMed, size==="Medium"?1:0); }
    if(boxLg) { boxLg.setAttribute('data-state', size==="Large"?1:0); updateCheckVisuals(boxLg, size==="Large"?1:0); }

    let eyeAware = 0;
    if (size === "Medium") eyeAware = 2;
    if (size === "Large") eyeAware = 4;
    let eyeBox = document.getElementById('eyeAwareness');
    if(eyeBox && eyeBox.value !== eyeAware.toString()) {
        eyeBox.value = eyeAware;
        localStorage.setItem('lotrr_eyeAwareness', eyeAware);
    }

    // War Gear, Specializations & Minimum Burden Parsing
    let notesEl = document.getElementById('notes');
    let notesTextClean = (notesEl ? notesEl.value || "" : "").replace(/\s+/g, ' ').toLowerCase();
    
    let warGearMod = 0;
    let minBurden = -1; // 0=Light, 1=Med, 2=Heavy

    if (notesTextClean.includes("geared for war")) {
        minBurden = 2;
        warGearMod = 1;
    } else if (notesTextClean.includes("prepared")) {
        minBurden = 1;
        warGearMod = 0;
    } else if (notesTextClean.includes("travelling light") || notesTextClean.includes("traveling light")) {
        minBurden = 0;
        warGearMod = -1;
    }

    let specExpertise = notesTextClean.includes("experts") ? 1 : 0;
    let specRally = notesTextClean.includes("stalwarts") ? 1 : 0;
    let specVigilance = notesTextClean.includes("sentinels") ? 1 : 0;

    // Evaluate Checkboxes Against Minimum Burden Constraint
    let burdenLightEl = document.getElementById('burdenLight');
    let isLight = burdenLightEl ? parseInt(burdenLightEl.getAttribute('data-state') || '0') : 0;
    
    let burdenMedEl = document.getElementById('burdenMed');
    let isMed = burdenMedEl ? parseInt(burdenMedEl.getAttribute('data-state') || '0') : 0;
    
    let burdenHvyEl = document.getElementById('burdenHvy');
    let isHeavyBurden = burdenHvyEl ? parseInt(burdenHvyEl.getAttribute('data-state') || '0') : 0;
    
    let burdenOverEl = document.getElementById('burdenOver');
    let isOver = burdenOverEl ? parseInt(burdenOverEl.getAttribute('data-state') || '0') : 0;

    let curBurden = -1;
    if (isOver) curBurden = 3;
    else if (isHeavyBurden) curBurden = 2;
    else if (isMed) curBurden = 1;
    else if (isLight) curBurden = 0;

    if (minBurden > -1 && curBurden < minBurden) {
        ['burdenLight', 'burdenMed', 'burdenHvy', 'burdenOver'].forEach(id => {
            let b = document.getElementById(id);
            if (b) { b.setAttribute('data-state', 0); updateCheckVisuals(b, 0); localStorage.setItem("lotrr_" + id, 0); }
        });
        let targetId = minBurden === 2 ? 'burdenHvy' : (minBurden === 1 ? 'burdenMed' : 'burdenLight');
        let tBox = document.getElementById(targetId);
        if (tBox) { tBox.setAttribute('data-state', 1); updateCheckVisuals(tBox, 1); localStorage.setItem("lotrr_" + targetId, 1); }
    }

    let warMod = 0;
    let manMod = 0;
    if (size === "Small") { warMod -= 1; manMod += 1; }
    else if (size === "Large") { warMod += 1; manMod -= 1; }

    warMod += warGearMod;

    let baseDisp = 2;
    let formatMod = (val) => (val >= 0 ? "+" : "") + val;

    // Auto Weary Math
    let wearyThreshold = Math.ceil(bandTotal / 2);
    let totalCasualties = missingCount + deadCount + seriousConditionCount;
    let wearyEl = document.getElementById('weary');
    let isWeary = (totalCasualties >= wearyThreshold);
    
    if (wearyEl) {
        let curWeary = parseInt(wearyEl.getAttribute('data-state') || '0');
        let newWeary = isWeary ? 1 : 0;
        if (curWeary !== newWeary) {
            wearyEl.setAttribute('data-state', newWeary);
            updateCheckVisuals(wearyEl, newWeary);
            localStorage.setItem('lotrr_weary', newWeary);
        }
    }

    dispBoxes.forEach(id => {
        let el = document.getElementById(id);
        if(el) {
            let finalVal = baseDisp;
            if (id === 'war') finalVal += warMod;
            if (id === 'manoeuvre') finalVal += manMod;
            if (id === 'expertise') finalVal += specExpertise;
            if (id === 'rally') finalVal += specRally;
            if (id === 'vigilance') finalVal += specVigilance;
            
            let formattedVal = formatMod(finalVal);
            
            if (el.value !== formattedVal) {
                el.value = formattedVal;
                localStorage.setItem(`lotrr_${id}`, formattedVal);
            }
            if (isWeary) {
                el.classList.add('penalty-active');
            } else {
                el.classList.remove('penalty-active');
            }
        }
    });
}


// ==========================================
// 2. BACKSTORY MODAL & DISTRIBUTION ENGINE
// ==========================================
function openBackstoryModal() {
    if (!isEditMode) return;
    const modal = document.getElementById('backstory-modal');
    const editor = document.getElementById('backstory-editor');
    const warning = document.getElementById('backstory-warning');
    
    if(modal && editor) {
        editor.value = localStorage.getItem('lotrr_Backstory_Full') || "";
        
        const breaks = (editor.value.match(/\n/g) || []).length;
        if (breaks >= 22 && warning) warning.classList.remove('hidden');
        else if (warning) warning.classList.add('hidden');
        
        modal.classList.remove('hidden');
    }
}

function saveAndCloseBackstory() {
    const modal = document.getElementById('backstory-modal');
    const editor = document.getElementById('backstory-editor');
    if(modal && editor) {
        const text = editor.value;
        localStorage.setItem('lotrr_Backstory_Full', text);
        modal.classList.add('hidden');
        distributeBackstory(text);
    }
}

function distributeBackstory(fullText) {
    const linesCount = 22;
    const inputs = [];
    for(let i=1; i<=linesCount; i++) {
        inputs.push(document.getElementById('Backstory-' + i));
    }
    if(!inputs[0]) return;

    inputs.forEach(input => { if(input) { input.value = ''; input.style.fontSize = ''; } });
    
    if(!fullText.trim()) return;

    const boxWidth = inputs[0].clientWidth;
    if(boxWidth === 0) {
        setTimeout(() => distributeBackstory(fullText), 100);
        return;
    }

    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    let baseFontSizeStr = window.getComputedStyle(inputs[0]).fontSize;
    let fontSize = parseFloat(baseFontSizeStr) || 16;
    const fontFamily = window.getComputedStyle(inputs[0]).fontFamily || "'Bilbo Swash Caps', cursive";

    let finalLines = [];
    
    while(fontSize > 4) {
        ctx.font = `bold ${fontSize}px ${fontFamily}`;
        finalLines = [];
        let paragraphs = fullText.split('\n');
        
        for (let p = 0; p < paragraphs.length; p++) {
            let words = paragraphs[p].split(' ');
            let currentLine = words[0] || "";
            
            for (let w = 1; w < words.length; w++) {
                let word = words[w];
                let width = ctx.measureText(currentLine + " " + word).width;
                if (width < (boxWidth - 4)) {
                    currentLine += " " + word;
                } else {
                    finalLines.push(currentLine);
                    currentLine = word;
                }
            }
            finalLines.push(currentLine); 
        }
        
        if (finalLines.length <= linesCount) {
            break; 
        }
        fontSize -= 0.5; 
    }
    
    const container = document.querySelector('.sheet-container');
    const containerWidth = container.clientWidth || 1000;
    const cqwSize = (fontSize / (containerWidth / 100)) + "cqw";
    
    for (let i = 0; i < linesCount; i++) {
        if (inputs[i]) {
            inputs[i].value = finalLines[i] || "";
            inputs[i].style.fontSize = cqwSize;
        }
    }
}


// ==========================================
// 3. UI CONTROLS & EDIT MODE
// ==========================================
function toggleMenu() {
    const menu = document.getElementById('floating-menu');
    if (menu) menu.classList.toggle('hidden');
}

function toggleEditMode() {
    isEditMode = !isEditMode;
    const menu = document.getElementById('floating-menu');
    if (menu) menu.classList.add('hidden');

    const doneBtn = document.getElementById('done-editing-btn');
    const portraitDiv = document.getElementById('Portrait');
    
    if (isEditMode) {
        if (doneBtn) doneBtn.classList.remove('hidden');
        if(portraitDiv) {
            portraitDiv.style.border = "1px dashed rgba(0,0,0,0.4)";
            portraitDiv.style.backgroundColor = "rgba(173, 216, 230, 0.2)";
        }

        document.querySelectorAll('.sheet-input').forEach(input => {
            if (!input.classList.contains('auto-calc') && !input.classList.contains('live-box')) {
                if (!input.classList.contains('backstory-line')) {
                    input.readOnly = false;
                }
                input.classList.add('editing-active');
            }
        });
    } else {
        if (doneBtn) doneBtn.classList.add('hidden');
        if(portraitDiv) {
            portraitDiv.style.border = "1px dashed transparent";
            portraitDiv.style.backgroundColor = "transparent";
        }

        document.querySelectorAll('.sheet-input').forEach(input => {
            if (!input.classList.contains('live-box') && input.tagName !== 'SELECT') {
                input.readOnly = true;
            }
            input.classList.remove('editing-active');
        });
    }
}

function switchTab(targetPageId, btnElement) {
    currentPageIndex = pageIds.indexOf(targetPageId); 

    pageIds.forEach((id, index) => {
        const page = document.getElementById(id);
        if (!page) return;
        
        page.classList.remove('hidden-left', 'hidden-right', 'hidden', 'active-page');
        
        if (index < currentPageIndex) {
            page.classList.add('hidden-left');
        } else if (index > currentPageIndex) {
            page.classList.add('hidden-right');
        } else {
            page.classList.add('active-page');
        }
    });

    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    if (btnElement) btnElement.classList.add('active');
    
    const targetPage = document.getElementById(targetPageId);
    if (targetPage) {
        setTimeout(() => {
            targetPage.querySelectorAll('.sheet-input').forEach(input => {
                if (input.id !== "Journal" && !input.classList.contains('backstory-line') && !input.id.startsWith('JourneyRole-') && !input.id.startsWith('AbilityCheck-') && typeof fitText === "function") fitText(input);
            });
            const savedBackstory = localStorage.getItem('lotrr_Backstory_Full');
            if(savedBackstory && targetPageId === 'page-2') distributeBackstory(savedBackstory);
        }, 300);
    }
}


// ==========================================
// 4. SHEET CALCULATORS & AUTOMATION
// ==========================================
function loadPortrait(event) {
    if (!isEditMode) return; 
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function(e) {
        const base64Str = e.target.result;
        const portraitDiv = document.getElementById('Portrait');
        if(portraitDiv) portraitDiv.style.backgroundImage = `url(${base64Str})`;
        localStorage.setItem("lotrr_Portrait", base64Str);
    };
    reader.readAsDataURL(file);
}

function updateProficiencyVisuals(el, state) {
    el.style.fontFamily = "";
    el.style.fontSize = ""; 

    if (state === 0) {
        el.innerText = '';
        el.style.backgroundColor = 'transparent'; 
        el.style.color = '#000000';
    } else if (state === 1) {
        el.innerText = '/';
        el.style.backgroundColor = 'transparent';
        el.style.color = '#000000';
    } else if (state === 2) {
        el.innerText = 'X';
        el.style.backgroundColor = 'transparent';
        el.style.color = '#000000';
    } else if (state === 3) {
        el.innerText = '';
        el.style.backgroundColor = '#000000'; 
        el.style.color = 'white';
    }
}

function cycleProficiency(el) {
    if (!isEditMode) return; 

    let state = parseInt(el.getAttribute('data-state') || '0');
    state = (state + 1) % 4; 
    el.setAttribute('data-state', state);
    localStorage.setItem("lotrr_" + el.id, state); 
    updateProficiencyVisuals(el, state);
    
    if (el.id.includes("SaveProf")) {
        calculateSave(el.id.replace("SaveProf", ""));
    } else if (el.id.includes("SkillProf")) {
        calculateSkill(el.id.replace("SkillProf-", ""));
    }
}

function updateCheckVisuals(el, state) {
    if (state === 0) {
        el.innerText = '';
        el.style.backgroundColor = 'transparent';
    } else if (state === 1) {
        el.innerText = '';
        el.style.backgroundColor = '#000000'; 
    }
}

function cycleCheck(el) {
    if (el.classList.contains('auto-calc')) return;
    if (el.id.startsWith("bandSize")) return; 

    if (el.id.includes("injuries") || el.id.includes("fatigue")) {
        handleProgressiveTrack(el);
        return;
    }

    let state = parseInt(el.getAttribute('data-state') || '0');

    if (el.id.startsWith("burden")) {
        state = (state + 1) % 2; 
        ['burdenLight', 'burdenMed', 'burdenHvy', 'burdenOver'].forEach(id => {
            let box = document.getElementById(id);
            if (box) {
                box.setAttribute('data-state', 0);
                updateCheckVisuals(box, 0);
                localStorage.setItem("lotrr_" + id, 0);
            }
        });
        if(state === 1) { 
            el.setAttribute('data-state', 1);
            updateCheckVisuals(el, 1);
            localStorage.setItem("lotrr_" + el.id, 1);
        }
        evaluateBandTab();
        return;
    }

    state = (state + 1) % 2; 
    el.setAttribute('data-state', state);
    localStorage.setItem("lotrr_" + el.id, state); 
    updateCheckVisuals(el, state);

    if (el.id.includes("hardened")) {
        evaluateBandTab();
    }
}

function updateInspirationVisuals(el, state) {
    if (state === 0) {
        el.style.backgroundImage = 'none';
        el.style.backgroundColor = 'transparent'; 
    } else if (state === 1) {
        el.style.backgroundImage = "url(data:image/png;base64,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)";
        el.style.backgroundColor = 'transparent';
    }
}

function toggleInspiration(el) {
    let state = parseInt(el.getAttribute('data-state') || '0');
    state = (state + 1) % 2; 
    el.setAttribute('data-state', state);
    localStorage.setItem("lotrr_" + el.id, state); 
    updateInspirationVisuals(el, state);
}

function fitText(el) {
    el.style.fontSize = ''; 
    let fontSize = parseFloat(window.getComputedStyle(el).fontSize);

    if (el.tagName.toLowerCase() === 'textarea') {
        while ((el.scrollWidth > el.clientWidth || el.scrollHeight > el.clientHeight) && fontSize > 4) {
            fontSize -= 0.5;
            el.style.fontSize = fontSize + 'px';
        }
        return;
    }

    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const fontFamily = window.getComputedStyle(el).fontFamily || "'Bilbo Swash Caps', cursive";
    const fontWeight = window.getComputedStyle(el).fontWeight || "bold";
    const text = el.value;
    
    if (!text) return;

    let boxWidth = el.clientWidth - 4; 
    if (boxWidth <= 0) return;

    while (fontSize > 4) {
        ctx.font = `${fontWeight} ${fontSize}px ${fontFamily}`;
        if (ctx.measureText(text).width <= boxWidth) {
            break; 
        }
        fontSize -= 0.5; 
    }
    
    el.style.fontSize = fontSize + 'px';
}

const skillStatMap = {
    1: "Dex", 2: "Wis", 3: "Str", 4: "Cha", 5: "Wis",
    6: "Wis", 7: "Wis", 8: "Cha", 9: "Int", 10: "Int",
    11: "Int", 12: "Int", 13: "Wis", 14: "Cha", 15: "Cha",
    16: "Int", 17: "Dex", 18: "Dex", 19: "Wis"
};

const skillNames = {
    1:"Acrobatics", 2:"Animal Handling", 3:"Athletics", 4:"Deception", 5:"Explore",
    6:"Hunting", 7:"Insight", 8:"Intimidation", 9:"Investigation", 10:"Medicine",
    11:"Nature", 12:"Old Lore", 13:"Perception", 14:"Performance", 15:"Persuasion",
    16:"Riddle", 17:"Sleight of Hand", 18:"Stealth", 19:"Travel"
};

function calculateLevel() {
    const xpInput = document.getElementById("ExpPoints");
    if (!xpInput) return;
    const xp = parseInt(xpInput.value.replace(/,/g, '')) || 0;
    
    const cultureEl = document.getElementById("Culture");
    const cultureInput = cultureEl ? cultureEl.value.trim().toLowerCase() : "";
    const isElf = /\b(elf|elves|elven)\b/i.test(cultureInput);

    let level = 1;
    if (xp >= 355000) level = 20; else if (xp >= 305000) level = 19; else if (xp >= 265000) level = 18;
    else if (xp >= 225000) level = 17; else if (xp >= 195000) level = 16; else if (xp >= 165000) level = 15;
    else if (xp >= 140000) level = 14; else if (xp >= 120000) level = 13; else if (xp >= 100000) level = 12;
    else if (xp >= 85000) level = 11; else if (xp >= 64000) level = 10; else if (xp >= 48000) level = 9;
    else if (xp >= 34000) level = 8; else if (xp >= 23000) level = 7; else if (xp >= 14000) level = 6;
    else if (xp >= 6500) level = 5; else if (xp >= 2700) level = 4; else if (xp >= 900) level = 3;
    else if (xp >= 300) level = 2;

    if (!isElf && level > 10) level = 10;

    const levelBox = document.getElementById("LevelDisplay");
    if (levelBox) {
        levelBox.value = `(Lvl. ${level})`;
        localStorage.setItem("lotrr_LevelDisplay", levelBox.value);
        if (typeof fitText === "function") fitText(levelBox);
    }

    const profBonus = Math.ceil(1 + (level / 4));
    const profBox = document.getElementById("ProfBonus");
    if (profBox) {
        profBox.value = "+" + profBonus;
        localStorage.setItem("lotrr_ProfBonus", profBox.value);
        if (typeof fitText === "function") fitText(profBox);
    }
    
    ["Str", "Dex", "Con", "Int", "Wis", "Cha"].forEach(stat => calculateSave(stat));
    for (let i = 1; i <= 19; i++) calculateSkill(i);
}

function calculateModifier(statId) {
    const scoreEl = document.getElementById(statId);
    if (!scoreEl) return;
    const score = parseInt(scoreEl.value);
    const modBox = document.getElementById(statId + "Mod");

    if(!modBox) return;

    if (isNaN(score)) {
        modBox.value = "";
    } else {
        const modifier = Math.floor((score - 10) / 2);
        const formattedMod = (modifier >= 0 ? "+" : "") + modifier;
        modBox.value = formattedMod;
    }

    localStorage.setItem("lotrr_" + modBox.id, modBox.value);
    if (typeof fitText === "function") fitText(modBox);
    
    calculateSave(statId);
    for (let i = 1; i <= 19; i++) {
        if (skillStatMap[i] === statId) calculateSkill(i);
    }
}

function calculateSave(statId) {
    const modBox = document.getElementById(statId + "Mod");
    const profBox = document.getElementById("ProfBonus");
    const saveProfBox = document.getElementById(statId + "SaveProf");
    const saveBonusBox = document.getElementById(statId + "SaveBonus");

    if (!modBox || !profBox || !saveProfBox || !saveBonusBox) return;

    const baseMod = parseInt(modBox.value) || 0;
    const profBonus = parseInt(profBox.value.replace('+', '')) || 0;
    const profState = parseInt(saveProfBox.getAttribute('data-state') || '0');

    let totalBonus = baseMod;
    if (profState === 1) totalBonus += Math.floor(profBonus / 2); 
    else if (profState === 2) totalBonus += profBonus;            
    else if (profState === 3) totalBonus += (profBonus * 2);      

    const formattedSave = (totalBonus >= 0 ? "+" : "") + totalBonus;
    saveBonusBox.value = formattedSave;
    
    localStorage.setItem("lotrr_" + saveBonusBox.id, formattedSave);
    if (typeof fitText === "function") fitText(saveBonusBox);
}

function calculateSkill(skillIndex) {
    const statId = skillStatMap[skillIndex];
    const modBox = document.getElementById(statId + "Mod");
    const profBox = document.getElementById("ProfBonus");
    const skillProfBox = document.getElementById("SkillProf-" + skillIndex);
    const skillBonusBox = document.getElementById("SkillBonus-" + skillIndex);

    if (!modBox || !profBox || !skillProfBox || !skillBonusBox) return;

    const baseMod = parseInt(modBox.value) || 0;
    const profBonus = parseInt(profBox.value.replace('+', '')) || 0;
    const profState = parseInt(skillProfBox.getAttribute('data-state') || '0');

    let totalBonus = baseMod;
    if (profState === 1) totalBonus += Math.floor(profBonus / 2); 
    else if (profState === 2) totalBonus += profBonus;            
    else if (profState === 3) totalBonus += (profBonus * 2);      

    const formattedBonus = (totalBonus >= 0 ? "+" : "") + totalBonus;
    skillBonusBox.value = formattedBonus;
    
    localStorage.setItem("lotrr_" + skillBonusBox.id, formattedBonus);
    if (typeof fitText === "function") fitText(skillBonusBox);
}

function calculateWeight() {
    let totalWeight = 0;
    
    let cp = parseInt(document.getElementById('CopperCoinCount')?.value) || 0;
    let sp = parseInt(document.getElementById('SilverPennyCount')?.value) || 0;
    let gp = parseInt(document.getElementById('GoldPieceCount')?.value) || 0;
    totalWeight += (cp + sp + gp) / 20;

    let triggers = document.querySelectorAll('.weight-trigger');
    for (let i = 0; i < triggers.length; i++) {
        let input = triggers[i];
        if(input.id.includes("CoinCount")) continue; 
        let val = input.value || "";
        if(val.trim() === "") continue;
        if(/unburdened/i.test(val)) continue;

        let match = val.match(/(\d+(\.\d+)?)\s*(lb|lbs|pound|pounds)/i);
        if(match) totalWeight += parseFloat(match[1]);
    }

    totalWeight = Math.round(totalWeight * 100) / 100;
    
    const weightBox = document.getElementById('CarriedWeight');
    if(weightBox) {
        weightBox.value = totalWeight + " lbs";
        localStorage.setItem("lotrr_CarriedWeight", totalWeight);
        if (typeof fitText === "function") fitText(weightBox);
    }
    
    checkEncumbrance(totalWeight);
}

function checkEncumbrance(weight) {
    let strEl = document.getElementById('Str');
    if(!strEl) return;
    let str = parseInt(strEl.value) || 0;
    if(str === 0) return;

    let multiplier = 1;
    for(let i=1; i<=22; i++) {
        let featEl = document.getElementById('Feature-' + i);
        let feat = featEl ? featEl.value || "" : "";
        if(/make light of burdens/i.test(feat)) {
            multiplier = 2;
            break;
        }
    }

    let isEncumbered = weight > (str * 5 * multiplier);
    let isHeavy = weight > (str * 10 * multiplier);

    let encBox = document.getElementById('Encumbered');
    let heavyBox = document.getElementById('HeavilyEncumbered');
    
    if(encBox) {
        encBox.setAttribute('data-state', isEncumbered ? 1 : 0);
        updateCheckVisuals(encBox, isEncumbered ? 1 : 0);
    }
    if(heavyBox) {
        heavyBox.setAttribute('data-state', isHeavy ? 1 : 0);
        updateCheckVisuals(heavyBox, isHeavy ? 1 : 0);
    }

    applyAllPenalties();
}

function calculateShadow() {
    let shadowEl = document.getElementById('ShadowScore');
    let shadow = shadowEl ? parseInt(shadowEl.value) || 0 : 0;
    
    let scarsEl = document.getElementById('ShadowScars');
    let scars = scarsEl ? parseInt(scarsEl.value) || 0 : 0;
    
    let wisEl = document.getElementById('Wis');
    if(!wisEl) return;
    let wis = parseInt(wisEl.value) || 0;
    
    if (wis === 0) return;

    let totalShadow = shadow + scars;
    let isMiserable = totalShadow >= Math.ceil(wis / 2);
    let isAnguished = totalShadow >= wis;

    let misBox = document.getElementById('Miserable');
    let angBox = document.getElementById('Anguished');
    let bandMisBox = document.getElementById('miserable');
    
    if(misBox) {
        misBox.setAttribute('data-state', isMiserable ? 1 : 0);
        updateCheckVisuals(misBox, isMiserable ? 1 : 0);
    }
    if(angBox) {
        angBox.setAttribute('data-state', isAnguished ? 1 : 0);
        updateCheckVisuals(angBox, isAnguished ? 1 : 0);
    }
    if(bandMisBox) {
        bandMisBox.setAttribute('data-state', isMiserable ? 1 : 0);
        updateCheckVisuals(bandMisBox, isMiserable ? 1 : 0);
    }

    applyAllPenalties();
}

function applyAllPenalties() {
    let penaltyEls = document.querySelectorAll('.penalty-active:not([id^="CompanyMember-"]):not([id^="JourneyRole-"]):not([id^="AbilityCheck-"]), .warning-active:not([id^="CompanyMember-"]):not([id^="JourneyRole-"]):not([id^="AbilityCheck-"])');
    for (let i = 0; i < penaltyEls.length; i++) {
        let el = penaltyEls[i];
        if (!["expertise", "manoeuvre", "rally", "vigilance", "war"].includes(el.id)) {
            el.classList.remove('penalty-active', 'warning-active');
        }
    }

    let encumberedEl = document.getElementById('Encumbered');
    let isEncumbered = encumberedEl ? encumberedEl.getAttribute('data-state') === '1' : false;
    
    let heavilyEncumberedEl = document.getElementById('HeavilyEncumbered');
    let isHeavy = heavilyEncumberedEl ? heavilyEncumberedEl.getAttribute('data-state') === '1' : false;
    
    let miserableEl = document.getElementById('Miserable');
    let isMiserable = miserableEl ? miserableEl.getAttribute('data-state') === '1' : false;
    
    let anguishedEl = document.getElementById('Anguished');
    let isAnguished = anguishedEl ? anguishedEl.getAttribute('data-state') === '1' : false;

    let speedBox = document.getElementById('Speed');
    if(speedBox) {
        let rawSpeed = speedBox.getAttribute('data-base-speed') || speedBox.value.replace(/\s*\(\-\d+\)/, '');
        if(isHeavy) speedBox.value = rawSpeed + " (-20)";
        else if(isEncumbered) speedBox.value = rawSpeed + " (-10)";
        else speedBox.value = rawSpeed;
        if(typeof fitText === "function") fitText(speedBox);
    }

    let rollables = document.querySelectorAll('.rollable');

    if (isAnguished) {
        for (let i = 0; i < rollables.length; i++) {
            let el = rollables[i];
            if (el.id !== 'HitDice' && !el.id.includes('AtkDamage') && !["expertise", "manoeuvre", "rally", "vigilance", "war"].includes(el.id)) {
                el.classList.add('penalty-active');
            }
        }
    } 
    else {
        if (isMiserable) {
             for (let i = 0; i < rollables.length; i++) {
                let el = rollables[i];
                if (el.id !== 'HitDice' && !el.id.includes('AtkDamage') && !["expertise", "manoeuvre", "rally", "vigilance", "war"].includes(el.id)) {
                    el.classList.add('warning-active');
                }
            }
        }

        if (isHeavy) {
            ['StrMod', 'DexMod', 'ConMod', 'StrSaveBonus', 'DexSaveBonus', 'ConSaveBonus', 'Initiative'].forEach(id => {
                let el = document.getElementById(id);
                if(el) { el.classList.remove('warning-active'); el.classList.add('penalty-active'); }
            });
            
            for(let i=1; i<=19; i++) {
                if(["Str", "Dex", "Con"].includes(skillStatMap[i])) {
                    let el = document.getElementById('SkillBonus-' + i);
                    if(el) { el.classList.remove('warning-active'); el.classList.add('penalty-active'); }
                }
            }
            
            for(let i=1; i<=4; i++) {
                let el = document.getElementById('AtkBonus-' + i);
                if(el) { el.classList.remove('warning-active'); el.classList.add('penalty-active'); }
            }
        } 
        else if (isEncumbered) {
            ['SkillBonus-3', 'SkillBonus-1'].forEach(id => {
                let el = document.getElementById(id);
                if(el) { el.classList.remove('warning-active'); el.classList.add('penalty-active'); }
            });
            let conSaveEl = document.getElementById('ConSaveBonus');
            if(conSaveEl && !conSaveEl.classList.contains('penalty-active')) {
                conSaveEl.classList.add('warning-active');
            }
        }
    }
}

function evaluateJourneyRoles() {
    const abilityMap = {
        "Guide": "Wisdom (Travel)",
        "Hunter": "Wisdom (Hunting)",
        "Lookout": "Wisdom (Perception)",
        "Scout": "Wisdom (Explore)"
    };

    const rows = [];
    
    for (let i = 1; i <= 7; i++) {
        const memberEl = document.getElementById('CompanyMember-' + i);
        const roleEl = document.getElementById('JourneyRole-' + i);
        const checkEl = document.getElementById('AbilityCheck-' + i);
        
        if (memberEl && roleEl && checkEl) {
            const roleVal = roleEl.value.trim();
            const checkVal = abilityMap[roleVal] || "";
            
            if (checkEl.value !== checkVal) {
                checkEl.value = checkVal;
            }

            rows.push({
                index: i,
                memberEl, roleEl, checkEl,
                name: memberEl.value.trim().toLowerCase(),
                role: roleVal
            });
        }
    }

    const nameCounts = {};
    rows.forEach(r => {
        if (r.name) nameCounts[r.name] = (nameCounts[r.name] || 0) + 1;
    });

    const overworkedNames = new Set();
    for (const [name, count] of Object.entries(nameCounts)) {
        if (count > 1) overworkedNames.add(name);
    }

    const roleCounts = {};
    rows.forEach(r => {
        if (r.name && !overworkedNames.has(r.name) && r.role) {
            roleCounts[r.role] = (roleCounts[r.role] || 0) + 1;
        }
    });

    const sharedRoles = new Set();
    for (const [role, count] of Object.entries(roleCounts)) {
        if (count > 1) sharedRoles.add(role);
    }

    rows.forEach(r => {
        r.memberEl.classList.remove('penalty-active', 'advantage-active');
        r.roleEl.classList.remove('penalty-active', 'advantage-active');
        r.checkEl.classList.remove('penalty-active', 'advantage-active');

        if (r.name) {
            if (overworkedNames.has(r.name)) {
                r.memberEl.classList.add('penalty-active');
                r.roleEl.classList.add('penalty-active');
                r.checkEl.classList.add('penalty-active');
            } 
            else if (r.role && sharedRoles.has(r.role)) {
                r.memberEl.classList.add('advantage-active');
                r.roleEl.classList.add('advantage-active');
                r.checkEl.classList.add('advantage-active');
            }
        }
    });
}


// ==========================================
// 5. INTERACTIVE DICE ROLLING ENGINE
// ==========================================
function initRollables() {
    document.querySelectorAll('.rollable').forEach(el => {
        let pressTimer;
        let isDragging = false;

        el.addEventListener('mouseup', (e) => {
            if (isEditMode || e.button === 2) return;
            const menu = document.getElementById('roll-menu');
            if (menu && menu.classList.contains('hidden')) {
                triggerRoll(el.id, 'normal');
            }
        });

        el.addEventListener('touchstart', (e) => {
            if (isEditMode) return;
            isDragging = false;
            pressTimer = window.setTimeout(() => openRollMenu(e.touches[0], el.id), 500);
        }, {passive: true});
        
        el.addEventListener('touchmove', () => {
            isDragging = true;
            clearTimeout(pressTimer);
        }, {passive: true});
        
        el.addEventListener('touchend', (e) => {
            if (isEditMode) return;
            clearTimeout(pressTimer);
            const menu = document.getElementById('roll-menu');
            if (!isDragging && menu && menu.classList.contains('hidden')) {
                e.preventDefault(); 
                triggerRoll(el.id, 'normal');
            }
        });

        el.addEventListener('contextmenu', (e) => {
            if (isEditMode) return;
            e.preventDefault(); 
            openRollMenu(e, el.id);
        });
    });
}

function openRollMenu(e, id) {
    if (id.includes("AtkDamage") || id === "HitDice") return; 

    currentRollTargetId = id;
    currentRollProfState = 0; 
    updateRollMenuProfUI();

    const extraModInput = document.getElementById('roll-extra-mod');
    if (extraModInput) extraModInput.value = "";

    const menu = document.getElementById('roll-menu');
    const profRow = document.getElementById('roll-menu-prof-row');

    if (profRow) {
        if (["StrMod", "DexMod", "ConMod", "IntMod", "WisMod", "ChaMod"].includes(id)) {
            profRow.style.display = 'flex';
        } else {
            profRow.style.display = 'none';
        }
    }

    if (menu) menu.classList.remove('hidden');
}

function closeRollMenu() {
    const menu = document.getElementById('roll-menu');
    if (menu) menu.classList.add('hidden');
}

function setRollProfState(level) {
    if (currentRollProfState === level) {
        currentRollProfState = 0;
    } else {
        currentRollProfState = level;
    }
    updateRollMenuProfUI();
}

function updateRollMenuProfUI() {
    ['prof-btn-1', 'prof-btn-2', 'prof-btn-3'].forEach(id => {
        const btn = document.getElementById(id);
        if (btn) btn.classList.remove('active');
    });
    
    if (currentRollProfState > 0) {
        const activeBtn = document.getElementById('prof-btn-' + currentRollProfState);
        if (activeBtn) activeBtn.classList.add('active');
    }
}

function executeMenuRoll(type) {
    if (currentRollTargetId) {
        triggerRoll(currentRollTargetId, type, true);
    }
}

function triggerRoll(id, rollType, fromMenu = false) {
    const menu = document.getElementById('roll-menu');
    if (menu) menu.classList.add('hidden'); 
    
    const el = document.getElementById(id);
    if (!el) return;
    let val = el.value.trim();
    if (!val && !id.includes("AbilityCheck-")) return; 

    if (!fromMenu && rollType === 'normal' && el.classList.contains('penalty-active') && !id.includes("AbilityCheck-")) {
        rollType = 'dis';
    }

    let extraMod = "";
    if (fromMenu) {
        let extraInput = document.getElementById('roll-extra-mod');
        let rawMod = extraInput ? extraInput.value.trim() : "";
        if (rawMod) {
            if (!rawMod.startsWith("+") && !rawMod.startsWith("-")) {
                extraMod = "+" + rawMod;
            } else {
                extraMod = rawMod;
            }
        }
    }

    let label = id;
    let isD20 = false;
    
    if (id.includes("SaveBonus")) {
        label = id.replace("SaveBonus", " Save");
        isD20 = true;
    } else if (id.includes("SkillBonus-")) {
        const idx = id.split("-")[1];
        label = skillNames[idx] || "Skill";
        isD20 = true;
    } else if (id.includes("AbilityCheck-")) {
        label = val || "Journey Ability Check";
        val = ""; 
        isD20 = true;
    } else if (id.includes("MountConMod-")) {
        label = "Mount Save";
        isD20 = true;
    } else if (id === "Initiative") {
        label = "Initiative";
        isD20 = true;
    } else if (["StrMod", "DexMod", "ConMod", "IntMod", "WisMod", "ChaMod"].includes(id)) {
        label = id.replace("Mod", " Check");
        isD20 = true;
        
        let baseMod = parseInt(val) || 0;
        if (currentRollProfState > 0) {
            const profEl = document.getElementById("ProfBonus");
            const profBonus = profEl ? parseInt(profEl.value.replace('+', '')) || 0 : 0;
            if (currentRollProfState === 1) baseMod += Math.floor(profBonus / 2);
            else if (currentRollProfState === 2) baseMod += profBonus;
            else if (currentRollProfState === 3) baseMod += (profBonus * 2);
            
            label += " (Tool)"; 
        }
        val = (baseMod >= 0 ? "+" : "") + baseMod;
        currentRollProfState = 0; 
        
    } else if (id.includes("AtkBonus-")) {
        const idx = id.split("-")[1];
        const nameEl = document.getElementById("AtkName-" + idx);
        label = (nameEl && nameEl.value) ? nameEl.value + " Attack" : "Attack";
        isD20 = true;
    } else if (id.includes("AtkDamage-")) {
        const idx = id.split("-")[1];
        const nameEl = document.getElementById("AtkName-" + idx);
        label = (nameEl && nameEl.value) ? nameEl.value + " Damage" : "Damage";
    } else if (id === "HitDice") {
        label = "Hit Dice";
    } else if (["expertise", "manoeuvre", "rally", "vigilance", "war"].includes(id)) {
        label = "Band " + id.charAt(0).toUpperCase() + id.slice(1);
        isD20 = true;
        
        let readModEl = document.getElementById('readinessScoreModifier');
        let readModStr = readModEl ? readModEl.value || "+0" : "+0";
        let readMod = parseInt(readModStr.replace('+', '')) || 0;
        let dispScore = parseInt(val) || 0;
        
        let wearyEl = document.getElementById('weary');
        let isWeary = wearyEl ? wearyEl.getAttribute('data-state') === '1' : false;
        if (isWeary) dispScore = 0; 
        
        let totalMod = readMod + dispScore;
        val = (totalMod >= 0 ? "+" : "") + totalMod;
    }

    const misBox = document.getElementById('Miserable');
    if (isD20 && misBox && misBox.getAttribute('data-state') === '1') {
        label += " - MISERABLE";
    }

    let commandString = "";
    
    if (isD20) {
        if (val !== "" && !val.startsWith("+") && !val.startsWith("-")) val = "+" + val;
        
        let dice = "1d20";
        if (rollType === 'adv') dice = "2d20kh1";
        if (rollType === 'dis') dice = "2d20kl1";
        
        commandString = `/roll ${dice}${val}${extraMod} [${label}]`;
    } else {
        commandString = `/roll ${val} [${label}]`;
    }

    sendToEncounterPlus(commandString);
}


// ==========================================
// 6. ENCYCLOPEDIA & POPUP MODALS (VERCEL VAULT)
// ==========================================

async function fetchFeatureFromVault(rawText) {
    if (!rawText) return { title: "Empty Slot", desc: "No Information is recorded here." };

    let normalizedText = rawText.replace(/[‘’`´]/g, "'");
    let lowerText = normalizedText.toLowerCase().trim();

    // BAND SHEET SPECIFIC CONDITIONS (Kept local as they are core UI mechanics)
    if (lowerText === "band weary") return { title: "Weary", desc: "If at least half the Allies on this mission (rounding up) are lost or suffering from a serious condition, the Band is Weary. When making a roll for a Weary Band, you cannot benefit from Disposition modifiers, even when the Disposition directly applies." };
    if (lowerText === "band miserable") return { title: "Miserable & Anguished", desc: "MISERABLE:\nIf your Shadow score equals or exceeds half your Wisdom score (rounded up), you and your Band are now miserable. A miserable character decreases the Fellowship rating of the Company by 1. In addition, if a miserable character’s d20 roll is a 1 or 2, the roll is a failure regardless of the DC for any ability check, attack roll, or saving throw.\n\nANGUISHED:\nIf your Shadow score reaches the full value of your Wisdom score, you and your Band become anguished. An anguished character is miserable, and has disadvantage on all ability checks, attack rolls, and saving throws. There is only one way to recover from such depths of desperation — the Player-hero or one Ally must experience a bout of madness." };
    if (lowerText.includes("heavily encumbered")) return { title: "Heavily Encumbered", desc: "If you carry weight in excess of 10 times your Strength score, up to your maximum carrying capacity, you are instead heavily encumbered, which means your speed drops by 20 feet and you have disadvantage on ability checks, attack rolls, and saving throws that use Strength, Dexterity, or Constitution." };
    if (lowerText.includes("encumbered")) return { title: "Encumbered", desc: "If you carry weight in excess of 5 times your Strength score, you are encumbered, which means your speed drops by 10 feet and you have disadvantage on Strength (Athletics) checks, Dexterity (Acrobatics) checks, and fatigue saving throws." };
    if (lowerText.includes("anguished")) return { title: "Anguished", desc: "If your Shadow score reaches the full value of your Wisdom score, you and your Band become anguished. An anguished character is miserable, and has disadvantage on all ability checks, attack rolls, and saving throws. There is only one way to recover from such depths of desperation — the Player-hero or one Ally must experience a bout of madness." };
    if (lowerText.includes("miserable")) return { title: "Miserable", desc: "If your Shadow score equals or exceeds half your Wisdom score (rounded up), you and your Band are now miserable. A miserable character decreases the Fellowship rating of the Company by 1. In addition, if a miserable character’s d20 roll is a 1 or 2, the roll is a failure regardless of the DC for any ability check, attack roll, or saving throw." };

    // Clean up dice modifiers and weights before asking the Vault
    let cleaned = normalizedText.replace(/\([^)]*\)/g, '').replace(/\[[^\]]*\]/g, '');
    cleaned = cleaned.replace(/(\+|-)\d+(d\d+)?(\/\+?\d+)?/gi, '');
    cleaned = cleaned.replace(/\b\d+(\.\d+)?\s*(lb|lbs|pound|pounds|oz)\b/gi, '');
    cleaned = cleaned.replace(/[^a-zA-Z\s,\-'’]/g, '').trim();

    if (!cleaned) return { title: rawText, desc: `No description found for '${rawText}'. Check your spelling, or ask the Loremaster!` };

    // SECURE VAULT FETCH
    try {
        const response = await fetch(`https://lot-rr-database.vercel.app/api/get-feature?name=${encodeURIComponent(cleaned)}`);
        const data = await response.json();

        if (response.ok && data.description) {
            return { title: cleaned, desc: data.description };
        } else {
            // Returns the exact error message we built into your Vercel backend
            return { title: cleaned, desc: data.error || `No description found for '${cleaned}'. Check your spelling, or ask the Loremaster!` };
        }
    } catch (error) {
        return { title: "Network Error", desc: "Could not connect to the Vault. Check your internet connection." };
    }
}

function initFeatureHelp() {
    document.querySelectorAll('.clickable-feature, #DistinctFeatures, [id^="Patron-"], [id^="ShadowPath"]').forEach(el => {
        let pressTimer;
        let isDragging = false;

        el.addEventListener('touchstart', (e) => {
            if (isEditMode) return;
            isDragging = false;
            pressTimer = window.setTimeout(() => triggerHelpModal(el.value.trim(), el.id === 'DistinctFeatures'), 500);
        }, {passive: true});
        
        el.addEventListener('touchmove', () => {
            isDragging = true;
            clearTimeout(pressTimer);
        }, {passive: true});
        
        el.addEventListener('touchend', () => {
            clearTimeout(pressTimer);
        });

        el.addEventListener('contextmenu', (e) => {
            if (isEditMode) return;
            e.preventDefault(); 
            triggerHelpModal(el.value.trim(), el.id === 'DistinctFeatures');
        });
    });
}

async function triggerHelpModal(featureName, isDistinctiveFeatures = false) {
    const titleEl = document.getElementById('feature-help-title');
    const descEl = document.getElementById('feature-help-desc');
    const modal = document.getElementById('feature-help-modal');
    
    if (!modal) return;

    // Show loading state while Vercel retrieves the data
    titleEl.innerText = "Loading...";
    descEl.innerText = "Consulting the lore...";
    modal.classList.remove('hidden');

    if (!featureName) {
        titleEl.innerText = "Empty Slot";
        descEl.innerText = "No Information is recorded here.";
    } else if (isDistinctiveFeatures) {
        let features = featureName.split(',').map(s => s.trim()).filter(s => s !== "");
        
        if (features.length === 0) {
            titleEl.innerText = "DISTINCTIVE FEATURES";
            descEl.innerText = "No distinctive features equipped.";
        } else {
            let hasStrider = false;
            features = features.filter(f => {
                if (f.toLowerCase() === "strider") { hasStrider = true; return false; }
                return true;
            });
            if (hasStrider) features.push("Strider");

            let finalDesc = "You may be rewarded with Inspiration by playing according to your distinctive features.\n\n";
            
            for (let i = 0; i < features.length; i++) {
                let result = await fetchFeatureFromVault(features[i]);
                finalDesc += `[${result.title.toUpperCase()}]\n${result.desc}\n\n`;
            }

            titleEl.innerText = "DISTINCTIVE FEATURES";
            descEl.innerText = finalDesc.trim();
        }
    } else {
        let result = await fetchFeatureFromVault(featureName);
        titleEl.innerText = result.title.replace(/(^|\s|-)\w/g, l => l.toUpperCase());
        descEl.innerText = result.desc;
    }
}

function closeFeatureHelp() {
    const modal = document.getElementById('feature-help-modal');
    if (modal) modal.classList.add('hidden');
}

function openRulesModal() {
    document.getElementById('rules-reference-modal').classList.remove('hidden');
}

function closeRulesModal() {
    document.getElementById('rules-reference-modal').classList.add('hidden');
}


// ==========================================
// 7. HERO LEDGER, IMPORT / EXPORT & CUSTOM ROLLS
// ==========================================
function sendCustomRoll() {
    const inputEl = document.getElementById("custom-roll-input");
    if (!inputEl) return;
    let val = inputEl.value.trim();
    if (!val) return;
    
    let commandString = val.startsWith("/roll") ? val : `/roll ${val} [Custom]`;
    sendToEncounterPlus(commandString);
    toggleMenu(); 
}

function getSafeHeroName(rawName) {
    if (rawName && rawName.trim() !== "") {
        return rawName.trim();
    }
    // Auto-number Unnamed Heroes
    let cacheStr = localStorage.getItem('lotrr_roster_cache');
    let cache = cacheStr ? JSON.parse(cacheStr) : [];
    let count = 1;
    let nameExists = true;
    while(nameExists) {
        let testName = `(Unnamed Hero ${count})`;
        nameExists = false;
        for (let i = 0; i < cache.length; i++) {
            if ((cache[i]['lotrr_Name'] || "") === testName) {
                nameExists = true;
                break;
            }
        }
        if (!nameExists) return `(Unnamed Hero ${count})`;
        count++;
    }
}

function getExportFileName(displayName) {
    let safeName = displayName || "Unknown_Hero";
    // Converts spaces to underscores for clean OS downloading
    return safeName.replace(/ /g, '_') + ".json";
}

function getCurrentHeroSaveState() {
    let charData = {};
    charData["encounterPlusAddress"] = localStorage.getItem("encounterPlusAddress") || "";
    charData["lotrr_Portrait"] = localStorage.getItem("lotrr_Portrait") || "";
    charData["lotrr_Backstory_Full"] = localStorage.getItem("lotrr_Backstory_Full") || "";
    charData["lotrr_allyBlockCount"] = localStorage.getItem("lotrr_allyBlockCount") || "1";

    document.querySelectorAll('.sheet-input').forEach(input => {
        if (input.id && !input.classList.contains('auto-calc')) {
            charData["lotrr_" + input.id] = input.value || "";
        }
    });
    document.querySelectorAll('.sheet-checkbox').forEach(box => {
        if (box.id) {
            charData["lotrr_" + box.id] = box.getAttribute('data-state') || "0";
        }
    });

    let safeName = getSafeHeroName(charData["lotrr_Name"] || "");
    charData["lotrr_Name"] = safeName;
    charData["lotrr_P2-Name"] = safeName;
    return charData;
}

function saveCurrentHeroToRoster(silent) {
    let charData = getCurrentHeroSaveState();
    let cacheStr = localStorage.getItem('lotrr_roster_cache');
    let cache = cacheStr ? JSON.parse(cacheStr) : [];
    let heroName = charData["lotrr_Name"];
    
    let existingIndex = -1;
    for (let i = 0; i < cache.length; i++) {
        if (cache[i]["lotrr_Name"] === heroName) {
            existingIndex = i;
            break;
        }
    }
    
    if (existingIndex >= 0) {
        cache[existingIndex] = charData;
    } else {
        cache.push(charData);
    }

    localStorage.setItem('lotrr_roster_cache', JSON.stringify(cache));
    if (silent !== true) {
        renderHeroLedger();
        alert(`Saved ${heroName} to the Hero Ledger!`);
    }
}

function openHeroLedger() {
    toggleMenu(); 
    renderHeroLedger();
    let ledgerModal = document.getElementById('hero-ledger-modal');
    if (ledgerModal) ledgerModal.classList.remove('hidden');
}

function closeHeroLedger() {
    let ledgerModal = document.getElementById('hero-ledger-modal');
    if (ledgerModal) ledgerModal.classList.add('hidden');
}

function renderHeroLedger() {
    let cacheStr = localStorage.getItem('lotrr_roster_cache');
    let cache = cacheStr ? JSON.parse(cacheStr) : [];
    let listEl = document.getElementById('hero-ledger-list');
    if (!listEl) return;
    
    listEl.innerHTML = "";

    if (cache.length === 0) {
        listEl.innerHTML = "<p style='text-align:center; color:#888; padding: 20px 0;'>Your Ledger is empty.</p>";
        return;
    }

    for (let index = 0; index < cache.length; index++) {
        let hero = cache[index];
        // UI Display forces spaces instead of underscores
        let name = (hero['lotrr_Name'] || "Unknown").replace(/_/g, ' ');
        let culture = hero['lotrr_Culture'] || "Unknown Culture";
        let callingLevel = hero['lotrr_Calling-and-Level'] || "Unknown Calling"; 
        let level = hero['lotrr_LevelDisplay'] || "(Lvl. 1)";

        let card = document.createElement('div');
        card.className = "hero-card";
        card.innerHTML = `
            <div class="hero-info">
                <div class="hero-name">${name}</div>
                <div class="hero-sub">${culture} • ${callingLevel} ${level}</div>
            </div>
            <div class="hero-actions">
                <button class="hero-btn load-btn" onclick="loadHeroFromRoster(${index})">Load</button>
                <button class="hero-btn del-btn" onclick="deleteHeroFromRoster(${index})">🗑️</button>
            </div>
        `;
        listEl.appendChild(card);
    }
}

function loadHeroFromRoster(index) {
    let cacheStr = localStorage.getItem('lotrr_roster_cache');
    let cache = cacheStr ? JSON.parse(cacheStr) : [];
    let targetHero = cache[index];
    if (!targetHero) return;

    saveCurrentHeroToRoster(true); // Auto-save current progress quietly

    // 1. THE NUKE: Wipe active memory
    let keysToRemove = [];
    for (let i = 0; i < localStorage.length; i++) {
        let key = localStorage.key(i);
        if (key && key.startsWith("lotrr_") && key !== "lotrr_roster_cache") {
            keysToRemove.push(key);
        }
    }
    for (let i = 0; i < keysToRemove.length; i++) {
        localStorage.removeItem(keysToRemove[i]);
    }

    // 2. THE REBUILD: Inject character
    for (let key in targetHero) {
        if (targetHero[key] !== "") {
            localStorage.setItem(key, targetHero[key]);
        }
    }
    location.reload();
}

function deleteHeroFromRoster(index) {
    let cacheStr = localStorage.getItem('lotrr_roster_cache');
    let cache = cacheStr ? JSON.parse(cacheStr) : [];
    
    // Executes immediately since iOS blocks confirm()
    cache.splice(index, 1);
    localStorage.setItem('lotrr_roster_cache', JSON.stringify(cache));
    renderHeroLedger();
}

function exportCharacter() {
    let charData = getCurrentHeroSaveState();
    let name = charData['lotrr_Name'];
    triggerDownload(charData, getExportFileName(name));
}

function exportAllCharacters() {
    let cacheStr = localStorage.getItem('lotrr_roster_cache');
    let cache = cacheStr ? JSON.parse(cacheStr) : [];
    if (cache.length === 0) {
        exportCharacter();
        return;
    }
    
    saveCurrentHeroToRoster(true); // Auto-save active sheet
    let newCacheStr = localStorage.getItem('lotrr_roster_cache');
    cache = newCacheStr ? JSON.parse(newCacheStr) : [];

    let fullExport = JSON.stringify(cache, null, 2);
    navigator.clipboard.writeText(fullExport).then(() => {
        alert("All characters copied to your clipboard! Paste into a text file to save.");
    }).catch(err => {
        alert("Clipboard access denied. Cannot export.");
    });
}

function triggerDownload(charData, fileName) {
    let jsonString = JSON.stringify(charData, null, 2);
    // iOS WKWebView blocks native downloads, so we copy to clipboard instead
    navigator.clipboard.writeText(jsonString).then(() => {
        alert(fileName + " copied to your clipboard! Paste it into an Apple Note or text file to save it.");
    }).catch(err => {
        alert("Clipboard access denied. Cannot export.");
    });
}

function importCharacter(event) {
    let fileInput = event.target;
    let files = fileInput.files;
    if (!files || files.length === 0) return;

    let cacheStr = localStorage.getItem('lotrr_roster_cache');
    let cache = cacheStr ? JSON.parse(cacheStr) : [];
    let processed = 0;

    for (let i = 0; i < files.length; i++) {
        let file = files[i];
        let reader = new FileReader();
        reader.onload = function(e) {
            try {
                let charData = JSON.parse(e.target.result);
                // Clean up underscores back to spaces in memory just in case an old file had them
                let name = charData['lotrr_Name'] || "(Unnamed Hero Import)";
                charData['lotrr_Name'] = name.replace(/_/g, ' ');
                charData['lotrr_P2-Name'] = charData['lotrr_Name'];

                let existingIndex = -1;
                for (let j = 0; j < cache.length; j++) {
                    if (cache[j]["lotrr_Name"] === charData['lotrr_Name']) {
                        existingIndex = j;
                        break;
                    }
                }
                
                if (existingIndex >= 0) {
                    cache[existingIndex] = charData; // Overwrite
                } else {
                    cache.push(charData); // Add new
                }

                processed++;
                if (processed === files.length) {
                    localStorage.setItem('lotrr_roster_cache', JSON.stringify(cache));
                    alert(`Successfully imported ${processed} hero(es) into the Ledger!`);
                    fileInput.value = ""; // Reset file input
                    
                    let ledgerModal = document.getElementById('hero-ledger-modal');
                    if (ledgerModal && !ledgerModal.classList.contains('hidden')) {
                        renderHeroLedger();
                    }
                }
            } catch(err) {
                alert(`Invalid character file: ${file.name}`);
            }
        };
        reader.readAsText(file);
    }
}

function createNewHero() {
    saveCurrentHeroToRoster(true); // Auto-save current progress quietly

    let keysToRemove = [];
    for (let i = 0; i < localStorage.length; i++) {
        let key = localStorage.key(i);
        if (key && key.startsWith("lotrr_") && key !== "lotrr_roster_cache") {
            keysToRemove.push(key);
        }
    }
    for (let i = 0; i < keysToRemove.length; i++) {
        localStorage.removeItem(keysToRemove[i]);
    }
    location.reload();
}

// ==========================================
// 8. ENCOUNTER+ VTT NETWORK LOGIC
// ==========================================
function saveServerAddress() {
    const addressInputEl = document.getElementById("ep-address-menu");
    if (!addressInputEl) return;
    
    const addressInput = addressInputEl.value.trim();
    if (addressInput === "") {
        alert("Please enter a valid IP and Port.");
        return;
    }
    localStorage.setItem("encounterPlusAddress", addressInput);
    alert("Address saved!"); 
    updateIframeMap();
}

function updateIframeMap() {
    let rawInput = localStorage.getItem("encounterPlusAddress");
    const iframe = document.getElementById("iframeMap");
    if (rawInput && iframe) {
        let cleanAddress = rawInput.replace(/^https?:\/\//, ''); 
        cleanAddress = cleanAddress.split('/')[0]; 
        iframe.src = `http://${cleanAddress}/client`;
    }
}

function sendToEncounterPlus(commandString) {
    let rawInput = localStorage.getItem("encounterPlusAddress");
    if (!rawInput) {
        alert("Please set your Encounter+ IP in the Menu first.");
        return;
    }
    let cleanAddress = rawInput.replace(/^https?:\/\//, ''); 
    cleanAddress = cleanAddress.split('/')[0]; 
    const url = `http://${cleanAddress}/api/messages`;

    const nameEl = document.getElementById("Name");
    const charName = nameEl ? nameEl.value.trim() || "Player" : "Player";
    const charColor = "#4a0000"; 

    const payload = {
        source: charName,       
        color: charColor,    
        type: "command",
        content: commandString
    };

    fetch(url, {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify(payload)
    })
    .then(response => {
        if (response.ok) {
            console.log("Success! Rolled:", commandString);
        } else {
            alert("Connection made, but server rejected it. Error Code: " + response.status);
        }
    })
    .catch(error => {
        alert("Network routing failed. Check VPN and IP address.");
    });
}