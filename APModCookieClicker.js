// ==UserScript==
// @name         AP_CookieClicker
// @namespace    http://tampermonkey.net/
// @version      2026-03-17
// @description  Archipelago
// @author       SX
// @match        https://orteil.dashnet.org/cookieclicker/
// @icon         https://www.google.com/s2/favicons?sz=64&domain=dashnet.org
// @require
// @grant        none
// @top-level-await
// ==/UserScript==

const {Client, itemsHandlingFlags} = await import(
  // Switched to a fork because main repo has a bug on hint ordering
  "https://unpkg.com/@airbreather/archipelago.js@2.0.5-airbreather"
  );
//'use strict';

// TODO
// Error Handling on Connection
// Logic for Achievements
// Configs for Shimmer
// Put all the agnostic stuff into a big object and export it as a lib

console.log("AP CookieClicker loaded");

//this started as Cookieclicker, but should work as a template for all browser games
//therefore code is split into Archipelago stuff, and Game specific Stuff
//so you just need to change Game Specific stuff

//ToastLibary, for Announcements
/* Not used in CC
const cssToast = document.createElement("link");
cssToast.href = "https://cdn.jsdelivr.net/npm/toastify-js/src/toastify.min.css";
cssToast.type = "text/css";
cssToast.rel = "stylesheet";
document.head.append(cssToast);
*/

const scriptToast = document.createElement("script");
scriptToast.src = "https://cdn.jsdelivr.net/npm/toastify-js";
scriptToast.type = "text/javascript";
document.head.append(scriptToast);

/* Usage
    Toastify({
        text: "This is a toast",
        duration: 3000
    }).showToast();
*/

// Input fields
const apMenuContainer = document.createElement("div");
apMenuContainer.id = "apMenu";

apMenuContainer.innerHTML = `
   <div id="apMenuArrow"> < </div>
   <form id="apConnectionForm">
    <span>Connect to your AP server </span>
    <fieldset id="apConnectionFields">
      <input name="hostname" placeholder="Address"/>
      <input name="port" placeholder="Port (38281 for local games)"/>
      <input name="slot" placeholder="Slot Name"/>
      <input name="password" placeholder="Password" type="password"/>
      <button type="submit">Connect</button>
      <br/>
      <span id="apFormError" class="APhide"></span>
    </fieldset>
  </form>
  <form id="apHintForm">
    <fieldset id="apHintFields" disabled>
      <input name="item" placeholder="Item name" list="itemList">
      <datalist id="itemList">/* populated after connection */</datalist>
      <input type="submit" value="Hint this!">
    </fieldset>
  </form>
`;


const formStyle = `
  fieldset { border: none;}
  #apMenu {
    margin: 0;
    padding: 15px;
    position: absolute;
    top: 30%;
    left: 0;
    z-index: 99999;
    display: flex;
    justify-content: center;
    align-items: center;
    flex-wrap: wrap;
    gap: 1rem;
    width: 20%;
    background-color: black;
    box-sizing: border-box;
    transition: 0.5s;

    &.isClosed {
      left: -20%;
    }
  }
  #apFormError {
    color: red;
    font-weight: bold;
  }
  #apMenuArrow {
    position: absolute;
    right: -20px;
    background-color: black;
    padding: 10px;
    border-radius: 10px;
  }
`;

const consoleInput = document.createElement("input")
consoleInput.id = "apCommandInput"
consoleInput.placeholder = "!command"
consoleInput.disabled = true;

// Console
consoleInput.addEventListener("keypress", function (event) {
  if (event.key === "Enter") {
    event.preventDefault();
    window.client.messages.say(consoleInput.value);
    consoleInput.value = "";
  }
});
apMenuContainer.append(consoleInput);
document.body.prepend(apMenuContainer);

// Injecting AP client style
const style = document.createElement("style");
style.textContent = `
  .hinted { opacity: 1 !important }
  .APhide { display: none !important }
` + formStyle;
document.head.append(style);

function typeToText(element) {
  const id = Number(element.text);

  if (element.type === "player_id" && !isNaN(id)) {
    return window.client.players.findPlayer(parseInt(element.text, 10))?.alias;
  } else if (element.type === "item_id" && !isNaN(id)) {
    return window.client.package.lookupItemName(
      window.client.players.findPlayer(element.player)?.game ?? "",
      parseInt(element.text, 10),
    );
  } else if (element.type === "location_id" && !isNaN(id)) {
    return window.client.package.lookupLocationName(
      window.client.players.findPlayer(element.player)?.game ?? "",
      parseInt(element.text, 10),
    );
  } else if (element.text !== undefined) {
    return element.text;
  } else {
    return element;
  }
}

function packetToText(packet) {
  if (packet === undefined) {
    return "";
  }
  let msg = "";
  packet.forEach((element) => {
    msg += typeToText(element);
  });
  return msg;
}

function sendCheckIdToAp(id) {
  window.client.check(id);
  // Essential to avoid discrepancies between AP server state and CC local save
  // We could do a full check after each game load to sync both, with forced Game.Win/Game.RemoveAchiev
  Game.WriteSave();
}

function connectAP(e) {
  e.preventDefault();
  console.debug("CONNECTION ATTEMPT", e);
  window.client = new Client();

  const fields = document.getElementById("apConnectionFields");
  const apFormError = document.getElementById("apFormError");
  fields.disabled = true;
  apFormError.classList.add("APhide");

  const handleError = error => {
      console.error("Error during connection attempt: ", error.toString())
      document.getElementById("apConnectionFields").disabled = true;
      apFormError.textContent = error.toString();
      apFormError.classList.remove("APhide");
      fields.disabled = false;
  };

  const { hostname, port, slot, password } = e.target;
  if (!hostname.value || !port.value || !slot.value) {
    handleError("Address, Port and Slot Name should not be empty!");
    return;
  }

  if (parseInt(port.value) !== parseInt(localStorage.getItem("port"))) {
    if (
      confirm(
        "Your Port changed, so this might be a new Game. DELETE LOCAL SAVE GAME?",
      ) == true
    ) {
      Game.HardReset(2);
      receivedItems = [];
    }
  }

  let self = this;
  const connectionInfo = {
    password: password.value,
    items_handling: itemsHandlingFlags.all,
  };
  const url = hostname.value + ":" + port.value;

  // If connected
  window.client.socket.disconnect();

  // Set up event listeners
  window.client.socket.on("connected", async (packet) => {
    console.log("Connected to server: ", packet);
    await appendFunctions();
    save();
  });

  window.client.socket.on("roomUpdate", (packet) => {
    console.log("Room update: ", packet);
  });

  window.client.socket.on("receivedItems", (packet) => {
    console.log("Received Items: ", packet);

    // When items.length > 1 its an reconnect
    if (packet.items.length > 1) {
      const difference = [];

      // Execute Items with firstTime = false > only Unlocks, no Traps or Items
      packet.items.forEach((item) => {
        if (receivedItems.includes(item.item)) {
          receiveItem(item.item, false);
        } else {
          receiveItem(item.item, true);
          toast(null, {
            receiving: window.client.players.self.slot,
            item: item,
            type: "ItemSend"
          })
          difference.push(item.item);
        }
      });

      // Compare serverItems with local saved (and executed Items)
      console.log("serverItems", packet.items.map(x => x.item));
      console.log("receivedItems", receivedItems);
      console.log("difference", difference);

      difference.forEach((id) => {
        receiveItem(id, true);
      });
    } else {
      // Just one Item means its new > always use
      receiveItem(packet.items[0].item, true);
    }
  });

  window.client.socket.on("locationInfo", (packet) => {
    console.log("Hint: ", packet);
    //self.hints.concat(packet.items);
  });

  window.client.socket.on("printJSON", (packet) => {
    console.debug("Print JSON: ", packet);
    let msg = packetToText(packet.data);
    if (msg === "") {
      return;
    }
    console.log("MSG: " + msg);
    toast(msg, packet);
  });

  // Connect to the Archipelago server
  window.client
    .login(url, slot.value, gameName, connectionInfo)
    .then(() => {
      console.log("Connected to the server");
      document.getElementById("apHintFields").disabled = false;
      consoleInput.disabled = false;
      const itemList = document.getElementById("itemList");
      Object.keys(window.client.package.findPackage(gameName).itemTable).forEach(item => itemList.innerHTML +=`<option value="${item}">`);
    })
    .catch(handleError);

  // Disconnect from the server when unloading window
  window.addEventListener("beforeunload", () => {
    window.client.socket.disconnect();
  });
}

const hintItem = e => {
  e.preventDefault();
  window.client.messages.say("!hint " + e.target.item.value)
    .then(() => e.target.item.value = "");
}

const toggleMenu = () => {
  apMenuContainer.classList.toggle("isClosed");
  document.getElementById("apMenuArrow").textContent = apMenuContainer.classList.contains("isClosed") ? ">" : "<";
}

document.getElementById("apConnectionForm").addEventListener("submit", connectAP);
document.getElementById("apHintForm").addEventListener("submit", hintItem);
document.getElementById("apMenuArrow").addEventListener("click", toggleMenu);

//forDev
// hostname.value = "archipelago.gg";
//port.value = "51981";
//name.value = "Alex_CC";

/*                                   */
/*                                   */
/* GAME SPECIFIC FUNCTIONS DOWN HERE */
/*                                   */
/*                                   */

const gameName = "Cookie Clicker";
let goalAchievementCount = 1000; // Default value prevent accidental goaling
let receivedItems = [];
let locationsByDisplayOrder = [];
// Fields should be the same as Options.py
const gameOptions = {
  advancement_goal: 1000,
  traps_percentage: 0,
  enable_hints: false,
  production_multiplier: 0,
  lump_multiplier: 0,
};

const buildingIconColumn = [0,1,2,3,4,15,16,17,5,6,7,8,13,14,19,20,32,33,34,35];

// FIXME: form fields should be stored in a APGame object or something but too much refacto for one commit. quick compat fix and will do at later time
const { hostname, port, slot: name, password } = document.getElementById("apConnectionForm");

/* On Site Loaded */
// Disable CookieClicker
document.getElementById("wrapper").style.visibility = "hidden";

function save() {
  localStorage.setItem("receivedItems", JSON.stringify(receivedItems));
  localStorage.setItem("host", hostname.value);
  localStorage.setItem("port", port.value);
  if (port.value === "") localStorage.setItem("port", "38281"); //Handle blank port -> default port
  localStorage.setItem("name", name.value);
  localStorage.setItem("password", password.value);
}

function load() {
  receivedItems = JSON.parse(localStorage.getItem("receivedItems")) || [];

  let urlParams = new URLSearchParams(window.location.search);
  hostname.value =
    urlParams.get("host") ||
    urlParams.get("Host") ||
    localStorage.getItem("host") ||
    hostname.value ||
    "archipelago.gg";
  port.value =
    urlParams.get("port") ||
    urlParams.get("Port") ||
    localStorage.getItem("port") ||
    port.value ||
    "";
  name.value =
    urlParams.get("name") ||
    urlParams.get("Name") ||
    localStorage.getItem("name") ||
    name.value ||
    "";
  password.value =
    urlParams.get("password") ||
    urlParams.get("Password") ||
    localStorage.getItem("password") ||
    password.value ||
    "";
}

load();

function randomProperty(obj) {
  let keys = Object.keys(obj);
  return obj[keys[(keys.length * Math.random()) << 0]];
}

// For this game we use the Games Chat, not the default Toast
// TODO add a toggle somewhere to filter notifications
function toast(message, {receiving: receiving, item: item, type: type} = {}) {

  if (type === "error") {
    Game.Notify("Error", message, [1, 7]); // "!" icon
    return;
  }
  if (receiving === window.client.players.self.slot) {
    if (type === "ItemSend") {
      const sender = window.client.players.findPlayer(item.player);
      const senderName = sender.slot === window.client.players.self.slot ? "You" : sender.alias;
      const locationName = window.client.package.lookupLocationName(sender.game, item.location);

      let id;
      let name;
      let icon;
      if (OFFSET.ITEMS.isBuilding(item.item)) {
        id = item.item - OFFSET.ITEMS.BUILDINGS;
        name = Game.ObjectsById[id];
        icon = [buildingIconColumn[id], 27]
      } else if (OFFSET.ITEMS.isUpgrade(item.item)) {
        const upgrade = Game.UpgradesById[item.item - OFFSET.ITEMS.UPGRADES - 1];
        id = upgrade.id;
        name = upgrade.name;
        icon = upgrade.icon;
      } else {
        message && Game.Notify("Archipelago", message);
        return;
      }

      Game.Notify("Item received", `${senderName} just found your <b>${name}</b> at ${locationName} !</div>`, icon);
      OFFSET.ITEMS.isUpgrade(item.item) && Game.NotifyTooltip("function(){return Game.crateTooltip(Game.UpgradesById[" + id + "]);}");
      return;
    }
  }
  if (type === "Hint") {
    const icon = [0, 8]; // Question marks
    const receiver = window.client.players.findPlayer(receiving);
    const sender = window.client.players.findPlayer(item.player);
    const itemName = window.client.package.lookupItemName(sender.game, item.item);
    const locationName = window.client.package.lookupLocationName(sender.game, item.location);

    Game.Notify("Hint", `${receiver.alias}'s <b>${itemName}</b> is located at <b>${locationName}</b> in ${sender.alias}'s world</div>`, icon);
    return;
  }
  Game.Notify("Archipelago", message);

  /*
  Toastify({
      text: message,
      duration: 5000
    }).showToast();
  */
}

const OFFSET = {
  ITEMS: {
    BUILDINGS: 10000000,
    UPGRADES: 20000000,
    FILLERS: 50000000,
    TRAPS: 60000000,
    isBuilding: id => Math.floor(id / 10000000) * 10000000 === OFFSET.ITEMS.BUILDINGS,
    isUpgrade: id => Math.floor(id / 10000000) * 10000000 === OFFSET.ITEMS.UPGRADES,
    isFiller: id => Math.floor(id / 10000000) * 10000000 === OFFSET.ITEMS.FILLERS,
    isTrap: id => Math.floor(id / 10000000) * 10000000 === OFFSET.ITEMS.TRAPS,
  },
  ACHIEVEMENTS: 42069001
}

function receiveItem(itemId, firstTime) {
  let building = randomProperty(Game.Objects); // FIXME should exclude locked buildings

  if (firstTime) {
    receivedItems.push(itemId);
    console.log(`I apply a new item! ${itemId}`);
  }

  save();

  if (OFFSET.ITEMS.isFiller(itemId) && firstTime) {
    switch (itemId) {
      case OFFSET.ITEMS.FILLERS + 0 :
        Game.cookies *= 2;
        console.log("*2 Cookies");
        break;
      case OFFSET.ITEMS.FILLERS + 1 :
        Game.cookies *= 999;
        console.log("*999 Cookies");
        break;
      case OFFSET.ITEMS.FILLERS + 2 :
        Game.cookies *= 9999;
        console.log("*9999 Cookies");
        break;
      case OFFSET.ITEMS.FILLERS + 3 :
        Game.cookies *= 9999999;
        console.log("*9999999 Cookies");
        break;
      case OFFSET.ITEMS.FILLERS + 4 :
        Game.cookies *= 0.5;
        console.log("*0.5 Cookies");
        break;
    }
  }
  if (OFFSET.ITEMS.isBuilding(itemId)) {
    switch (itemId) {
      case OFFSET.ITEMS.BUILDINGS + 0 : // Unlock Cursor
        document.getElementById("product0").style.display = "";
        break;
      case OFFSET.ITEMS.BUILDINGS + 1 : // Unlock Grandma
        document.getElementById("product1").style.display = "";
        break;
      case OFFSET.ITEMS.BUILDINGS + 2 : // Unlock Farm
        document.getElementById("product2").style.display = "";
        break;
      case OFFSET.ITEMS.BUILDINGS + 3 : // Unlock Mine
        document.getElementById("product3").style.display = "";
        break;
      case OFFSET.ITEMS.BUILDINGS + 4 : // Unlock Factory
        document.getElementById("product4").style.display = "";
        break;
      case OFFSET.ITEMS.BUILDINGS + 5 : // Unlock Bank
        document.getElementById("product5").style.display = "";
        break;
      case OFFSET.ITEMS.BUILDINGS + 6 : // Unlock Temple
        document.getElementById("product6").style.display = "";
        break;
      case OFFSET.ITEMS.BUILDINGS + 7 : // Unlock Wizard Tower
        document.getElementById("product7").style.display = "";
        break;
      case OFFSET.ITEMS.BUILDINGS + 8 : // Unlock Shipment
        document.getElementById("product8").style.display = "";
        break;
      case OFFSET.ITEMS.BUILDINGS + 9 : // Unlock Alchemy Lab
        document.getElementById("product9").style.display = "";
        break;
      case OFFSET.ITEMS.BUILDINGS + 10 : // Unlock Portal
        document.getElementById("product10").style.display = "";
        break;
      case OFFSET.ITEMS.BUILDINGS + 11 : // Unlock Time Machine
        document.getElementById("product11").style.display = "";
        break;
      case OFFSET.ITEMS.BUILDINGS + 12 : // Unlock Antimatter Condenser
        document.getElementById("product12").style.display = "";
        break;
      case OFFSET.ITEMS.BUILDINGS + 13 : // Unlock Prism
        document.getElementById("product13").style.display = "";
        break;
      case OFFSET.ITEMS.BUILDINGS + 14 : // Unlock Chancemaker
        document.getElementById("product14").style.display = "";
        break;
      case OFFSET.ITEMS.BUILDINGS + 15 : // Unlock Fractal Engine
        document.getElementById("product15").style.display = "";
        break;
      case OFFSET.ITEMS.BUILDINGS + 16 : // Unlock Javascript Console
        document.getElementById("product16").style.display = "";
        break;
      case OFFSET.ITEMS.BUILDINGS + 17 : // Unlock Idleverse
        document.getElementById("product17").style.display = "";
        break;
      case OFFSET.ITEMS.BUILDINGS + 18 : // Unlock Cortex Baker
        document.getElementById("product18").style.display = "";
        break;
      case OFFSET.ITEMS.BUILDINGS + 19 : // Unlock You
        document.getElementById("product19").style.display = "";
        break;
    }
  }
  if (OFFSET.ITEMS.isUpgrade(itemId)) {
    let upgrade = Game.UpgradesById[itemId - OFFSET.ITEMS.UPGRADES - 1];
    upgrade.basePrice = -1;
    if (upgrade.buy() !== 1) {
      // If there is no buy function, set it to bought manually
      upgrade.bought = 1;
    }
  }
  if (OFFSET.ITEMS.isTrap(itemId) && firstTime) {
    switch (itemId) {
      case OFFSET.ITEMS.TRAPS + 0 :
        building.amount = Math.max(building.amount - 1, 0);
        Game.Notify("Archipelago", "-1 " + building.name);
        console.log("-1 Building");
        break;
      case OFFSET.ITEMS.TRAPS + 1 :
        building.amount = Math.max(building.amount - 10, 0);
        Game.Notify("Archipelago", "-10 " + building.name);
        console.log("-10 Building");
        break;
      case OFFSET.ITEMS.TRAPS + 2 :
        building.amount = Math.max(building.amount - 100, 0);
        Game.Notify("Archipelago", "-100 " + building.name);
        console.log("-100 Building");
        break;
      case OFFSET.ITEMS.TRAPS + 3 :
        Game.cookies *= 0.9;
        console.log("-10% Cookies");
        break;
      case OFFSET.ITEMS.TRAPS + 4 :
        Game.cookies *= 0.8;
        console.log("-20% Cookies");
        break;
      case OFFSET.ITEMS.TRAPS + 5 :
        Game.cookies *= 0.7;
        console.log("-30% Cookies");
        break;
      case OFFSET.ITEMS.TRAPS + 6 :
        Game.cookies *= 0.6;
        console.log("-40% Cookies");
        break;
      case OFFSET.ITEMS.TRAPS + 7 :
        Game.cookies *= 0.5;
        console.log("-50% Cookies");
        break;
      case OFFSET.ITEMS.TRAPS + 8 :
        Game.cookies *= 0.4;
        console.log("-60% Cookies");
        break;
      case OFFSET.ITEMS.TRAPS + 9 :
        Game.cookies *= 0.3;
        console.log("-70% Cookies");
        break;
      case OFFSET.ITEMS.TRAPS + 10 :
        Game.cookies *= 0.2;
        console.log("-80% Cookies");
        break;
      case OFFSET.ITEMS.TRAPS + 11 :
        Game.cookies *= 0.1;
        console.log("-90% Cookies");
        break;
      case OFFSET.ITEMS.TRAPS + 12 :
        Game.cookies = 0;
        console.log("-100% Cookies");
        break;
    }
  }
}

function loadAchieveNum() {
  // Game.AchievementsOwned does not include shadow achievements
  return Object.values(Game.Achievements).filter(achv => achv.won).length;
}

function debounceAndMergeInputs(func, delay) {
  let timeout;
  let allArgs = []
  return function (...args) {
    allArgs.push(...args);
    clearTimeout(timeout);
    timeout = setTimeout(() => {
      func.apply(this, allArgs);
      allArgs = [];
    }, delay);
  };
}

/*
 When buying buildings by 100, many consecutive achievements are unlocked at once
 To prevent hinting locations that are unlocked right after, we apply a debounce and batch the request
*/
const scoutLocations = debounceAndMergeInputs((...locations) => {
  console.log("Scouting locations ", locations);
  window.client.scout(locations.map(me => me.id + OFFSET.ACHIEVEMENTS), 2)
}, 3000); // 500 deemed not enough by testers

// Reveal item locked behind adjacent achievements when completing one
function hintAdjacentLocations(it) {
  const aaa = locationsByDisplayOrder.findIndex(loc => loc.name === it.name)
  const prev = locationsByDisplayOrder[aaa - 1]
  const next = locationsByDisplayOrder[aaa + 1]
  if (!!prev && !prev.won) { scoutLocations(prev) }
  if (!!next && !next.won) { scoutLocations(next) }
}

// Append functions which need to be set or overwritten after Connection during Runtime
async function appendFunctions() {
  //enable CookieClicker
  document.getElementById("wrapper").style.visibility = "visible";

  //disable Buying of Upgrades
  //FIXME : some upgrades are not in the item pool and player should be able to buy them
  //document.getElementById("upgrades").style.pointerEvents = "none";

  //lock all Stores
  document.getElementById("product0").style.display = "none";
  //document.getElementById("product1").style.display = "none"; Grandmas are enabled from start
  document.getElementById("product2").style.display = "none";
  document.getElementById("product3").style.display = "none";
  document.getElementById("product4").style.display = "none";
  document.getElementById("product5").style.display = "none";
  document.getElementById("product6").style.display = "none";
  document.getElementById("product7").style.display = "none";
  document.getElementById("product8").style.display = "none";
  document.getElementById("product9").style.display = "none";
  document.getElementById("product10").style.display = "none";
  document.getElementById("product11").style.display = "none";
  document.getElementById("product12").style.display = "none";
  document.getElementById("product13").style.display = "none";
  document.getElementById("product14").style.display = "none";
  document.getElementById("product15").style.display = "none";
  document.getElementById("product16").style.display = "none";
  document.getElementById("product17").style.display = "none";
  document.getElementById("product18").style.display = "none";
  document.getElementById("product19").style.display = "none";

  // Read all game options
  await window.client.players.self.fetchSlotData().then((slotData) => {
    // Set advancement_goal as goalAchievementCount
    goalAchievementCount = slotData.advancement_goal;
    Object.keys(gameOptions).forEach(optionName => gameOptions[optionName] = slotData[optionName]);
    console.log("Game options:", gameOptions);
  });

  // Build a list of achievements ordered by their order field (ie. their display order)
  for (let i in Game.Achievements)//sort the achievements
  {
    locationsByDisplayOrder.push(Game.Achievements[i]);
  }
  let sortMap = function (a, b) {
    if (a.order > b.order) return 1;
    else if (a.order < b.order) return -1;
    else return 0;
  }
  locationsByDisplayOrder.sort(sortMap);

  // TODO add a client config panel and make hint display toggleable
  // Overwrite menu drawing so hinted locations are emphasized
  const CCUpdateMenu = Game.UpdateMenu;
  Game.UpdateMenu = (me, context) => {
    CCUpdateMenu(me, context);
    const menu = document.getElementById("menu");
    let menuItems = new Map(Object.values(menu.querySelectorAll(".achievement:not(.enabled)")).map(i => [i.dataset.id, i]))
    const hints = window.client.items.hints.filter(o => !o.found && o.item.locationGame === gameName)
    hints.forEach(h => {
      menuItems.get(String(h.item.locationId - OFFSET.ACHIEVEMENTS))?.classList.add("hinted")
    })
  }

  // Display hinted item name in the tooltip
  const mysterious = "???"
  const CCcrateTooltip = Game.crateTooltip;
  Game.crateTooltip = (me, context) => {
    let str = CCcrateTooltip(me, context);
    if (me.type === "achievement") {
      let h = window.client.items.hints.find(o => !o.found && o.item.locationId === me.id + OFFSET.ACHIEVEMENTS);
      if (!!h) {
        str = str
          .replace(mysterious, `${h.item.locationName}`)
          .replace(mysterious, `Will send item <b>${h.item.name}</b> to <b>${h.item.receiver.name}</b><br>---<br><b>Condition: </b>${me.desc}`)
      }
    }
    return str
  }

  function applyProductionMultiplier() {
    new Game.buffType('AP cookies', function (time, pow) {
      return {
        name: '[AP] Blessing from another world',
        desc: `Cookie production x${pow} forever!`,
        icon: [23, 16],
        time: 1000000000 * Game.fps,
        add: false,
        multCpS: pow,
        aura: 1
      };
    });
    Game.gainBuff('AP cookies', null, 10 ** gameOptions.production_multiplier);
  }

  function applyLumpMultiplier() {
    new Game.buffType('AP lumps', function (time, pow) {
      return {
        name: '[AP] Sugar from another world',
        desc: `All sugar lump harvests will yield x${pow} lumps forever!`,
        icon: [33, 0],
        time: 1000000000 * Game.fps,
        add: false,
        aura: 1
      };
    });
    Game.gainBuff('AP lumps', null, gameOptions.lump_multiplier);
    const CCgainLumps = Game.gainLumps;
    Game.gainLumps = total => CCgainLumps(total * gameOptions.lump_multiplier);
  }

  if (gameOptions.production_multiplier && gameOptions.production_multiplier > 0) applyProductionMultiplier();
  if (gameOptions.lump_multiplier && gameOptions.lump_multiplier > 1) applyLumpMultiplier();

  // Overwrite for win function CookieClicker
  Game.Win = function (what) {
    if (typeof what === "string") {
      if (Game.Achievements[what]) {
        let it = Game.Achievements[what];
        if (it.won == 0) {
          let name = it.shortName ? it.shortName : it.dname;
          it.won = 1;
          Game.Notify(
            loc("Achievement unlocked"),
            '<div class="title" style="font-size:18px;margin-top:-2px;">' +
            name +
            "</div>",
            it.icon,
          );
          Game.NotifyTooltip(
            "function(){return Game.crateTooltip(Game.AchievementsById[" +
            it.id +
            "]);}",
          );
          if (Game.CountsAsAchievementOwned(it.pool)) Game.AchievementsOwned++;
          Game.recalculateGains = 1;
          if (App && it.vanilla) App.gotAchiev(it.id);

          // Send AchievementID to AP
          sendCheckIdToAp(it.id + OFFSET.ACHIEVEMENTS);
          if (gameOptions.enable_hints) hintAdjacentLocations(it);

          const gameWon = window.client.items.received.some(i => i.id === 42000000)
          if (!gameWon && loadAchieveNum() >= goalAchievementCount) {
            console.log("Win-condition met!");
            sendCheckIdToAp(42000000)
            window.client.goal();
          }
        }
      }
    } else {
      for (let i in what) {
        Game.Win(what[i]);
      }
    }
  };

  // Overwrite Cookies
  //10x Shimmers
  let shimmersFactor = 10;

  Game.updateShimmers = function () {
    // Run shimmer functions, kill overtimed shimmers and spawn new ones
    for (var i in Game.shimmers) {
      Game.shimmers[i].update();
    }

    // Cookie storm!
    if (Game.hasBuff("Cookie storm") && Math.random() < 0.5) {
      var newShimmer = new Game.shimmer(
        "golden",
        {type: "cookie storm drop"},
        1,
      );
      newShimmer.dur = Math.ceil(Math.random() * 4 + 1);
      newShimmer.life = Math.ceil(Game.fps * newShimmer.dur);
      //newShimmer.force='cookie storm drop';
      newShimmer.sizeMult = Math.random() * 0.75 + 0.25;
    }

    // Spawn shimmers
    for (var i in Game.shimmerTypes) {
      let me = Game.shimmerTypes[i];
      if (me.spawnsOnTimer && me.spawnConditions()) {
        // Only run on shimmer types that work on a timer
        if (!me.spawned) {
          // No shimmer spawned for this type? Check the timer and try to spawn one
          //me.time++;
          me.time = me.time + shimmersFactor;
          if (
            Math.random() <
            Math.pow(
              Math.max(0, (me.time - me.minTime) / (me.maxTime - me.minTime)),
              5,
            )
          ) {
            var newShimmer = new Game.shimmer(i);
            newShimmer.spawnLead = 1;
            if (
              Game.Has("Distilled essence of redoubled luck") &&
              Math.random() < 0.01
            )
              var newShimmer = new Game.shimmer(i);
            me.spawned = 1;
          }
        }
      }
    }
  };

  // Extend
  const CCReincarnate = Game.Reincarnate;
  Game.Reincarnate = function (bypass) {
      CCReincarnate();
      // Reapply custom buffs cleared during ascension
      if (gameOptions.production_multiplier && gameOptions.production_multiplier > 0) applyProductionMultiplier();
      if (gameOptions.lump_multiplier && gameOptions.lump_multiplier > 1) applyLumpMultiplier();
      // Reapply all items
      receivedItems.forEach((id) => {
        receiveItem(id, false);
      });
    }

  // Boost lump times by default. Max ripe time is 10mn instead of 24h
  Game.computeLumpTimes = function () {
    let minute = 1000 * 60;
    Game.lumpMatureAge = minute * 9;
    Game.lumpRipeAge = minute * 10;
    if (Game.Has("Stevia Caelestis")) Game.lumpRipeAge -= minute;
    if (Game.Has("Diabetica Daemonicus")) Game.lumpMatureAge -= minute;
    if (Game.Has("Ichor syrup")) Game.lumpMatureAge -= minute/60 * 7;
    if (Game.Has("Sugar aging process"))
      // In vanilla, 600 grandmas ~= 4% timer reduction
      Game.lumpRipeAge -= minute/600 * Math.min(600, Game.Objects["Grandma"].amount); // Capped at 600 grandmas
    if (Game.hasGod && Game.BuildingsOwned % 10 == 0) {
      let godLvl = Game.hasGod("order");
      if (godLvl == 1) Game.lumpRipeAge -= minute;
      else if (godLvl == 2) Game.lumpRipeAge -= (minute / 3) * 2;
      else if (godLvl == 3) Game.lumpRipeAge -= minute / 3;
    }
    //if (Game.hasAura('Dragon\'s Curve')) {Game.lumpMatureAge/=1.05;Game.lumpRipeAge/=1.05;}
    Game.lumpMatureAge /= 1 + Game.auraMult("Dragon's Curve") * 0.05;
    Game.lumpRipeAge /= 1 + Game.auraMult("Dragon's Curve") * 0.05;
    Game.lumpOverripeAge = Game.lumpRipeAge + minute;
    // Note : Applying every single buffs is equivalent to ~20% timer reduction

    // Debug upgrade
    if (Game.Has("Glucose-charged air")) {
      Game.lumpMatureAge /= 2000;
      Game.lumpRipeAge /= 2000;
      Game.lumpOverripeAge /= 2000;
    }
  };
}