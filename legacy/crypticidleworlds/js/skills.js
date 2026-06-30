// js/skills.js

const skillList = {
  // Combat Skills
  attack: {
    name: "Striker Protocol",
    icon: "attack.png",
    type: "combat"
  },
  strength: {
    name: "Force Module",
    icon: "strength.png",
    type: "combat"
  },
  defense: {
    name: "Barrier Matrix",
    icon: "defense.png",
    type: "combat"
  },
  magic: {
    name: "Neurohex",
    icon: "magic.png",
    type: "combat"
  },
  ranged: {
    name: "Synapsis Bowline",
    icon: "ranged.png",
    type: "combat"
  },

  // Non-Combat Skills
  slayer: {
    name: "Slayer",
    icon: "slayer.png",
    type: "noncombat"
  },
  cryptomining: {
    name: "Cryptomining",
    icon: "cryptomining.png",
    type: "noncombat"
  },
  datafishing: {
    name: "Datafishing",
    icon: "datafishing.png",
    type: "noncombat"
  },
  codecraft: {
    name: "Codecraft",
    icon: "codecraft.png",
    type: "noncombat"
  },
  forgenetics: {
    name: "Forgentics",
    icon: "forgenetics.png",
    type: "noncombat"
  },
  system_hacking: {
    name: "System Hacking",
    icon: "system_hacking.png",
    type: "noncombat"
  }
};

function renderSkillUI(skillData, containerId) {
  const container = document.getElementById(containerId);
  container.innerHTML = '';

  for (const skill in skillList) {
    const info = skillList[skill];
    const data = skillData[skill] || { xp: 0, level: 1 };
    const level = data.level;
    const xp = data.xp;
    const nextXP = xpTable[level + 1] || xpTable[99];
    const percent = Math.min(100, Math.floor((xp / nextXP) * 100));

    if ((info.type === 'combat' && containerId === 'combat-skills') ||
        (info.type === 'noncombat' && containerId === 'noncombat-skills')) {
      const li = document.createElement('li');
      li.innerHTML = `<a href='skills/skill${skill}.html' style='color:#00ff99;text-decoration:none;'>
        <div class='skill-row'>
          <div class='icon-box'><img src='assets/skills/${info.icon}' alt='${skill}' width='16'></div>
          <span>${info.name}</span>
          <span class='level'>Lv. ${level} (${percent}%)</span>
        </div>
      </a>`;
      container.appendChild(li);
    }
  }
}
