/**
 * Extend the base Actor entity by defining a custom roll data structure which is ideal for the Simple system.
 * @extends {Actor}
 */
import { FormatDice, FormatDiceOld } from '../dice.js'
export class DemonlordActor extends Actor {
  /** @override */
  prepareBaseData () {
    switch (this.data.type) {
      case 'character':
        return this._prepareCharacterData(this.data)
      case 'creature':
        return this._prepareCharacterData(this.data)
    }
  }

  /**
   * Prepare Character type specific data
   */
  _prepareCharacterData (actorData) {
    const data = actorData.data
    let will
    let savedAncestry = null
    let pathHealthBonus = 0
    let ancestryFixedArmor = false

    const characterbuffs = this.generateCharacterBuffs()
    const ancestries = this.getEmbeddedCollection('OwnedItem').filter(
      (e) => e.type === 'ancestry'
    )

    for (const ancestry of ancestries) {
      savedAncestry = ancestry

      if (!game.settings.get('demonlord', 'useHomebrewMode')) {
        data.attributes.strength.value = parseInt(
          ancestry.data.attributes?.strength.value
        )
        data.attributes.agility.value = parseInt(
          ancestry.data.attributes?.agility.value
        )
        data.attributes.intellect.value = parseInt(
          ancestry.data.attributes?.intellect.value
        )
        data.attributes.will.value = parseInt(
          ancestry.data.attributes?.will.value
        )

        data.characteristics.insanity.max = ancestry.data.attributes?.will.value

        // Paths
        if (data.level > 0) {
          for (let i = 1; i <= data.level; i++) {
            const paths = this.getEmbeddedCollection('OwnedItem').filter(
              (e) => e.type === 'path'
            )
            paths.forEach((path) => {
              path.data.levels
                .filter(function ($level) {
                  return $level.level == i
                })
                .forEach(function ($level) {
                  // Attributes
                  if ($level.attributeStrengthSelected) {
                    data.attributes.strength.value += parseInt(
                      $level.attributeStrength
                    )
                  }
                  if ($level.attributeAgilitySelected) {
                    data.attributes.agility.value += parseInt(
                      $level.attributeAgility
                    )
                  }
                  if ($level.attributeIntellectSelected) {
                    data.attributes.intellect.value += parseInt(
                      $level.attributeIntellect
                    )
                  }
                  if ($level.attributeWillSelected) {
                    data.attributes.will.value += parseInt($level.attributeWill)
                  }

                  if ($level.attributeSelectIsFixed) {
                    if ($level.attributeStrength > 0) {
                      data.attributes.strength.value += parseInt(
                        $level.attributeStrength
                      )
                    }
                    if ($level.attributeAgility > 0) {
                      data.attributes.agility.value += parseInt(
                        $level.attributeAgility
                      )
                    }
                    if ($level.attributeIntellect > 0) {
                      data.attributes.intellect.value += parseInt(
                        $level.attributeIntellect
                      )
                    }
                    if ($level.attributeWill > 0) {
                      data.attributes.will.value += parseInt(
                        $level.attributeWill
                      )
                    }
                  }

                  pathHealthBonus += $level.characteristicsHealth

                  switch (path.data.type) {
                    case 'novice':
                      data.paths.novice = path.name
                      break
                    case 'expert':
                      data.paths.expert = path.name
                      break
                    case 'master':
                      data.paths.master = path.name
                      break
                    default:
                      break
                  }
                })
            })
          }
        }
      } else {
        // Paths
        if (data.level > 0) {
          for (let i = 1; i <= data.level; i++) {
            const paths = this.getEmbeddedCollection('OwnedItem').filter(
              (e) => e.type === 'path'
            )
            paths.forEach((path) => {
              path.data.levels
                .filter(function ($level) {
                  return $level.level == i
                })
                .forEach(function ($level) {
                  pathHealthBonus += $level.characteristicsHealth

                  switch (path.data.type) {
                    case 'novice':
                      data.paths.novice = path.name
                      break
                    case 'expert':
                      data.paths.expert = path.name
                      break
                    case 'master':
                      data.paths.master = path.name
                      break
                    default:
                      break
                  }
                })
            })
          }
        }
      }

      // Calculate Health and Healing Rate
      if (game.settings.get('demonlord', 'reverseDamage')) {
        if (data.characteristics.health.value < 0) {
          data.characteristics.health.value =
            parseInt(data.attributes.strength.value) +
            parseInt(ancestry.data.characteristics?.healthmodifier) +
            characterbuffs.healthbonus +
            pathHealthBonus
        }
        data.characteristics.health.max =
          parseInt(data.attributes.strength.value) +
          parseInt(ancestry.data.characteristics?.healthmodifier) +
          characterbuffs.healthbonus +
          pathHealthBonus
      } else {
        data.characteristics.health.max =
          parseInt(data.attributes.strength.value) +
          parseInt(ancestry.data.characteristics?.healthmodifier) +
          characterbuffs.healthbonus +
          pathHealthBonus
      }
      if (data.level >= 4) {
        if (game.settings.get('demonlord', 'reverseDamage')) {
          if (data.characteristics.health.value == 0) {
            data.characteristics.health.value += parseInt(
              ancestry.data.level4?.healthbonus
            )
          }
          data.characteristics.health.max += parseInt(
            ancestry.data.level4?.healthbonus
          )
        } else {
          data.characteristics.health.max += parseInt(
            ancestry.data.level4?.healthbonus
          )
        }
      }
      data.characteristics.health.healingrate =
        Math.floor(parseInt(data.characteristics.health.max) / 4) +
        parseInt(ancestry.data.characteristics?.healingratemodifier)
      // ******************

      data.attributes.perception.value =
        parseInt(data.attributes.intellect.value) +
        parseInt(ancestry.data.characteristics.perceptionmodifier)

      if (parseInt(ancestry.data.characteristics?.defensemodifier) > 10) {
        data.characteristics.defense = parseInt(
          ancestry.data.characteristics?.defensemodifier
        )
        ancestryFixedArmor = true
      } else {
        data.characteristics.defense =
          parseInt(data.attributes.agility.value) +
          parseInt(ancestry.data.characteristics.defensemodifier)
      }

      data.characteristics.power = parseInt(
        ancestry.data.characteristics?.power
      )
      data.characteristics.speed = parseInt(
        ancestry.data.characteristics?.speed
      )
      data.characteristics.size = ancestry.data.characteristics.size

      // These were still breaking the sanity/corruption fields..
      // data.characteristics.insanity.value += parseInt(
      //   ancestry.data.characteristics.insanity
      // )
      // data.characteristics.corruption += parseInt(
      //   ancestry.data.characteristics.corruption
      // )
    }

    if (savedAncestry == null && this.data.type != 'creature') {
      data.attributes.perception.value = parseInt(
        data.attributes.intellect.value
      )
      data.characteristics.defense = parseInt(data.attributes.agility.value)

      if (game.settings.get('demonlord', 'reverseDamage')) {
        if (data.characteristics.health.value == 0) {
          data.characteristics.health.value =
            parseInt(data.attributes.strength.value) +
            characterbuffs.healthbonus
        }
        data.characteristics.health.max =
          parseInt(data.attributes.strength.value) + characterbuffs.healthbonus
      } else {
        data.characteristics.health.max =
          parseInt(data.attributes.strength.value) + characterbuffs.healthbonus
      }
    }

    // Paths
    let pathDefenseBonus = 0
    if (data.level > 0) {
      const actor = this

      for (let i = 1; i <= data.level; i++) {
        const paths = this.getEmbeddedCollection('OwnedItem').filter(
          (e) => e.type === 'path'
        )
        paths.forEach((path) => {
          path.data.levels
            .filter(function ($level) {
              return $level.level == i
            })
            .forEach(function ($level) {
              // Characteristics
              data.characteristics.power =
                parseInt(data.characteristics.power) +
                parseInt($level.characteristicsPower)
              pathDefenseBonus = $level.characteristicsDefense
              data.characteristics.speed += $level.characteristicsSpeed
              data.attributes.perception.value +=
                $level.characteristicsPerception
            })
        })
      }
    }

    // Loop through ability scores, and add their modifiers to our sheet output.
    for (const [key, attribute] of Object.entries(data.attributes)) {
      if (attribute.value > attribute.max) {
        attribute.value = attribute.max
      }
      if (attribute.value < attribute.min) {
        attribute.value = attribute.min
      }

      attribute.modifier = attribute.value - 10
      attribute.label = CONFIG.DL.attributes[key].toUpperCase()
    }

    const armors = this.getEmbeddedCollection('OwnedItem').filter(
      (e) => e.type === 'armor'
    )
    let armorpoint = 0
    let agilitypoint = 0
    let defenseBonus = 0
    let speedPenalty = 0
    for (const armor of armors) {
      if (armor.data.wear) {
        // If you wear armor and do not meet or exceed its requirements: -2 speed
        if (
          !armor.data.isShield &&
          armor.data.strengthmin != '' &&
          !ancestryFixedArmor &&
          parseInt(armor.data.strengthmin) >
            parseInt(data.attributes.strength.value)
        ) {
          speedPenalty = -2
        }

        if (armor.data.agility && agilitypoint == 0) {
          agilitypoint = parseInt(armor.data.agility)
        }
        if (armor.data.fixed) armorpoint = parseInt(armor.data.fixed)
        if (armor.data.defense) defenseBonus = parseInt(armor.data.defense)
      }
    }

    if (ancestryFixedArmor) {
      if (armorpoint > data.characteristics.defense) {
        data.characteristics.defense = armorpoint
      }
      data.characteristics.defense +=
        pathDefenseBonus + defenseBonus + characterbuffs.defensebonus
    } else if (armorpoint >= 11) {
      data.characteristics.defense =
        parseInt(armorpoint) +
        parseInt(defenseBonus) +
        pathDefenseBonus +
        characterbuffs.defensebonus
    } else {
      data.characteristics.defense =
        parseInt(data.characteristics.defense) +
        parseInt(defenseBonus) +
        parseInt(agilitypoint) +
        pathDefenseBonus +
        characterbuffs.defensebonus
    }

    if (data.characteristics.defense > 25) data.characteristics.defense = 25

    characterbuffs.speedbonus += speedPenalty

    if (game.settings.get('demonlord', 'useHomebrewMode')) {
      data.characteristics.health.healingrate = Math.floor(
        parseInt(data.characteristics.health.max) / 4
      )
    }

    // Afflictions
    if (data.afflictions.slowed) {
      data.characteristics.speed = Math.floor(
        parseInt(data.characteristics.speed + speedPenalty) / 2
      )
    } else {
      data.characteristics.speed =
        parseInt(data.characteristics.speed) +
        parseInt(characterbuffs.speedbonus)
    }

    if (data.afflictions.defenseless) data.characteristics.speed = 5

    if (data.afflictions.blinded) {
      data.characteristics.speed =
        parseInt(data.characteristics.speed) < 2
          ? parseInt(data.characteristics.speed)
          : 2
    }

    // Calculate Insanity
    data.characteristics.insanity.max = data.attributes.will.value

    data.characteristics.power += parseInt(characterbuffs.powerbonus)

    if (data.actions.rush) {
      data.characteristics.speed = data.characteristics.speed * 2
    }

    if (data.actions.retreat) {
      data.characteristics.speed = Math.floor(data.characteristics.speed / 2)
    }

    if (data.afflictions.immobilized) data.characteristics.speed = 0

    if (data.afflictions.unconscious) data.characteristics.defense = 5
  }

  async createItemCreate (event) {
    event.preventDefault()

    const header = event.currentTarget
    // Get the type of item to create.
    const type = header.dataset.type
    // Grab any data associated with this control.
    const data = duplicate(header.dataset)
    // Initialize a default name.
    const name = `New ${type.capitalize()}`
    // Prepare the item object.
    const itemData = {
      name: name,
      type: type,
      data: data
    }

    // Remove the type from the dataset since it's in the itemData.type prop.
    delete itemData.data.type

    // Finally, create the item!
    return await this.createOwnedItem(itemData)
  }

  async _onDeleteEmbeddedEntity (embeddedName, child, options, userId) {
    const characterbuffs = this.generateCharacterBuffs()

    if (child.data?.addtonextroll) {
      await this.update({
        'data.characteristics.defensebonus':
          parseInt(characterbuffs.defensebonus) -
          (parseInt(child.data.bonuses.defense)
            ? parseInt(child.data.bonuses.defense)
            : 0),
        'data.characteristics.healthbonus':
          parseInt(characterbuffs.healthbonus) -
          (parseInt(child.data.bonuses.health)
            ? parseInt(child.data.bonuses.health)
            : 0),
        'data.characteristics.speedbonus':
          parseInt(characterbuffs.speedbonus) -
          (parseInt(child.data.bonuses.speed)
            ? parseInt(child.data.bonuses.speed)
            : 0),
        'data.characteristics.defense':
          parseInt(this.data.data.characteristics.defense) -
          (parseInt(child.data.bonuses.defense)
            ? parseInt(child.data.bonuses.defense)
            : 0),
        'data.characteristics.health.max':
          parseInt(this.data.data.characteristics.health.max) -
          (parseInt(child.data.bonuses.health)
            ? parseInt(child.data.bonuses.health)
            : 0),
        'data.characteristics.speed.value':
          parseInt(this.data.data.characteristics.speed.value) -
          (parseInt(child.data.bonuses.speed)
            ? parseInt(child.data.bonuses.speed)
            : 0)
      })
    }
  }

  rollChallenge (attribute) {
    if (typeof attribute === 'string' || attribute instanceof String) {
      attribute = this.data.data.attributes[attribute]
    }

    let attLabel =
      attribute.label?.charAt(0).toUpperCase() +
      attribute.label?.toLowerCase().slice(1)
    if (!attribute.label && isNaN(attLabel)) {
      attLabel =
        attribute.charAt(0)?.toUpperCase() + attribute.toLowerCase().slice(1)
    }

    if (this.data.data.afflictions.defenseless && attLabel != 'Perception') {
      ui.notifications.error(
        game.i18n.localize('DL.DialogWarningDefenselessFailer')
      )
    } else if (this.data.data.afflictions.unconscious) {
      ui.notifications.error(
        game.i18n.localize('DL.DialogWarningUnconsciousFailer')
      )
    } else if (this.data.data.afflictions.blinded && attLabel == 'Perception') {
      ui.notifications.error(
        game.i18n.localize('DL.DialogWarningBlindedChallengeFailer')
      )
    } else if (this.data.data.afflictions.stunned) {
      ui.notifications.error(
        game.i18n.localize('DL.DialogWarningStunnedFailer')
      )
    } else if (this.data.data.afflictions.surprised) {
      ui.notifications.error(
        game.i18n.localize('DL.DialogWarningSurprisedFailer')
      )
    } else {
      const d = new Dialog({
        title:
          this.name +
          ': ' +
          game.i18n.localize('DL.DialogChallengeRoll').slice(0, -2),
        content:
          "<div class='challengedialog'><b>" +
          game.i18n.localize('DL.DialogChallengeRoll') +
          '</b>' +
          game.i18n.localize(attLabel) +
          "<br/></div><br/><div class='challengedialog'><b>" +
          game.i18n.localize('DL.DialogAddBonesAndBanes') +
          "</b><input id='boonsbanes' style='width: 50px;margin-left: 5px;text-align: center' type='text' value=0 data-dtype='Number'/></div>" +
          '<br/><div class="challengedialog"><b>' +
          game.i18n.localize('DL.ModsAdd') +
          "<input id='modifier' style='width: 50px;margin-left: 5px;text-align: center' type='text' value=0 data-dtype='Number'/>" +
          '</b></div><br/>',
        buttons: {
          roll: {
            icon: '<i class="fas fa-check"></i>',
            label: game.i18n.localize('DL.DialogRoll'),
            callback: (html) =>
              this.rollAttribute(
                attribute,
                html.find('[id="boonsbanes"]').val(),
                html.find('[id="modifier"]').val()
              )
          },
          cancel: {
            icon: '<i class="fas fa-times"></i>',
            label: game.i18n.localize('DL.DialogCancel'),
            callback: () => {}
          }
        },
        default: 'roll',
        close: () => {}
      })
      d.render(true)
    }
  }

  rollAttribute (attribute, boonsbanes, modifier) {
    const buffs = this.generateCharacterBuffs('')
    let attribueName =
      attribute.label?.charAt(0).toUpperCase() +
      attribute.label?.toLowerCase().slice(1)
    if (!attribute.label && isNaN(attribueName)) {
      attribueName =
        attribute.charAt(0)?.toUpperCase() + attribute.toLowerCase().slice(1)
    }

    // Roll
    let diceformular = '1d20'
    if (attribute && attribute.modifier != 0) {
      diceformular =
        diceformular +
        (attribute.modifier > 0 ? '+' + attribute.modifier : attribute.modifier)
    }
    // Add boonsbanes to Strength rolls
    if (
      attribute.label === 'STRENGTH' &&
      parseInt(buffs?.challengestrengthbonus) != 0
    ) {
      boonsbanes = parseInt(boonsbanes) + parseInt(buffs.challengestrengthbonus)
    }
    // Add boonsbanes to Agility rolls
    if (
      attribute.label === 'AGILITY' &&
      parseInt(buffs?.challengeagilitybonus) != 0
    ) {
      boonsbanes = parseInt(boonsbanes) + parseInt(buffs.challengeagilitybonus)
    }
    // Add boonsbanes to Intellect rolls
    if (
      attribute.label === 'INTELLECT' &&
      parseInt(buffs?.challengeintellectbonus) != 0
    ) {
      boonsbanes =
        parseInt(boonsbanes) + parseInt(buffs.challengeintellectbonus)
    }
    // Add boonsbanes to Will rolls
    if (
      attribute.label === 'WILL' &&
      parseInt(buffs?.challengewillbonus) != 0
    ) {
      boonsbanes = parseInt(boonsbanes) + parseInt(buffs.challengewillbonus)
    }
    // Add boonsbanes to Perception rolls
    if (
      attribute.label === 'PERCEPTION' &&
      parseInt(buffs?.challengeperceptionbonus) != 0
    ) {
      boonsbanes =
        parseInt(boonsbanes) + parseInt(buffs.challengeperceptionbonus)
    }

    if (boonsbanes != undefined && !isNaN(boonsbanes) && boonsbanes != 0) {
      diceformular = diceformular + '+' + boonsbanes + 'd6kh'
    }

    if (modifier != 0) {
      diceformular = diceformular + '+' + parseInt(modifier)
    }

    const r = new Roll(diceformular, {})
    r.roll()

    // Format Dice
    const diceData = isNewerVersion(game.data.version, '0.6.9')
      ? FormatDice(r)
      : FormatDiceOld(r)

    var templateData = {
      actor: this,
      item: {
        name: attribueName.toUpperCase()
      },
      data: {
        diceTotal: {
          value: r._total
        },
        resultText: {
          value:
            r._total >= 10
              ? game.i18n.localize('DL.DiceResultSuccess')
              : game.i18n.localize('DL.DiceResultFailure')
        },
        isCreature: {
          value: this.data.type == 'creature'
        },
        afflictionEffects: {
          value: this.buildAfflictionsEffects('CHALLENGE')
        },
        actionEffects: { value: this.buildActionEffects('CHALLENGE') }
      },
      diceData
    }

    const chatData = {
      user: game.user._id,
      speaker: {
        actor: this._id,
        token: this.token,
        alias: this.name
      }
    }

    const rollMode = game.settings.get('core', 'rollMode')
    if (['gmroll', 'blindroll'].includes(rollMode)) {
      chatData.whisper = ChatMessage.getWhisperRecipients('GM')
    }
    if (
      this.data.type == 'creature' &&
      game.settings.get('demonlord', 'rollCreaturesToGM')
    ) {
      chatData.whisper = ChatMessage.getWhisperRecipients('GM')
    }

    const template = 'systems/demonlord/templates/chat/challenge.html'
    renderTemplate(template, templateData).then((content) => {
      chatData.content = content
      if (game.dice3d) {
        game.dice3d
          .showForRoll(r, game.user, true, chatData.whisper, chatData.blind)
          .then((displayed) => ChatMessage.create(chatData))
      } else {
        chatData.sound = CONFIG.sounds.dice
        ChatMessage.create(chatData)
      }
    })
  }

  rollWeaponAttackMacro (itemId, boonsbanes, damagebonus) {
    if (this.data.data.afflictions.dazed) {
      ui.notifications.error(game.i18n.localize('DL.DialogWarningDazedFailer'))
    } else if (this.data.data.afflictions.defenseless) {
      ui.notifications.error(
        game.i18n.localize('DL.DialogWarningDefenselessFailer')
      )
    } else if (this.data.data.afflictions.surprised) {
      ui.notifications.error(
        game.i18n.localize('DL.DialogWarningSurprisedFailer')
      )
    } else if (this.data.data.afflictions.stunned) {
      ui.notifications.error(
        game.i18n.localize('DL.DialogWarningStunnedFailer')
      )
    } else if (this.data.data.afflictions.unconscious) {
      ui.notifications.error(
        game.i18n.localize('DL.DialogWarningUnconsciousFailer')
      )
    } else {
      const item = this.getOwnedItem(itemId)
      const attackAttribute = item.data.data.action?.attack
      const characterbuffs = this.generateCharacterBuffs('ATTACK')
      characterbuffs.attackbonus += boonsbanes ? parseInt(boonsbanes) : 0
      characterbuffs.attackdamagebonus += damagebonus ? '+' + damagebonus : ''

      if (attackAttribute) {
        const d = new Dialog({
          title:
            game.i18n.localize('DL.DialogAttackRoll') +
            game.i18n.localize(item.name),
          content:
            '<div class="challengedialog"><b>' +
            game.i18n.localize('DL.DialogAddBonesAndBanes') +
            "</b><input id='boonsbanes' style='width: 50px;margin-left: 5px;text-align: center' type='text' value=0 data-dtype='Number'/>" +
            '</div><br/><div class="challengedialog"><b>' +
            game.i18n.localize('DL.ModsAdd') +
            "<input id='modifier' style='width: 50px;margin-left: 5px;text-align: center' type='text' value=0 data-dtype='Number'/>" +
            '</b></div><br/>',
          buttons: {
            roll: {
              icon: '<i class="fas fa-check"></i>',
              label: game.i18n.localize('DL.DialogRoll'),
              callback: (html) =>
                this.rollAttack(
                  item,
                  html.find('[id="boonsbanes"]').val(),
                  characterbuffs,
                  html.find('[id="modifier"]').val()
                )
            },
            cancel: {
              icon: '<i class="fas fa-times"></i>',
              label: game.i18n.localize('DL.DialogCancel'),
              callback: () => {}
            }
          },
          default: 'roll',
          close: () => {}
        })
        d.render(true)
      } else {
        this.rollAttack(item, 0, characterbuffs, 0)
      }
    }
  }

  rollWeaponAttack (itemId, options = { event: null }) {
    if (this.data.data.afflictions.dazed) {
      ui.notifications.error(game.i18n.localize('DL.DialogWarningDazedFailer'))
    } else if (this.data.data.afflictions.defenseless) {
      ui.notifications.error(
        game.i18n.localize('DL.DialogWarningDefenselessFailer')
      )
    } else if (this.data.data.afflictions.surprised) {
      ui.notifications.error(
        game.i18n.localize('DL.DialogWarningSurprisedFailer')
      )
    } else if (this.data.data.afflictions.stunned) {
      ui.notifications.error(
        game.i18n.localize('DL.DialogWarningStunnedFailer')
      )
    } else if (this.data.data.afflictions.unconscious) {
      ui.notifications.error(
        game.i18n.localize('DL.DialogWarningUnconsciousFailer')
      )
    } else {
      const item = this.getOwnedItem(itemId)
      const attackAttribute = item.data.data.action?.attack
      const characterbuffs = this.generateCharacterBuffs('ATTACK')

      if (attackAttribute) {
        const d = new Dialog({
          title:
            game.i18n.localize('DL.DialogAttackRoll') +
            game.i18n.localize(item.name),
          content:
            '<div class="challengedialog"><b>' +
            game.i18n.localize('DL.DialogAddBonesAndBanes') +
            "</b><input id='boonsbanes' style='width: 50px;margin-left: 5px;text-align: center' type='text' value=0 data-dtype='Number'/>" +
            '</div><br/><div class="challengedialog"><b>' +
            game.i18n.localize('DL.ModsAdd') +
            "<input id='modifier' style='width: 50px;margin-left: 5px;text-align: center' type='text' value=0 data-dtype='Number'/>" +
            '</b></div><br/>',
          buttons: {
            roll: {
              icon: '<i class="fas fa-check"></i>',
              label: game.i18n.localize('DL.DialogRoll'),
              callback: (html) =>
                this.rollAttack(
                  item,
                  html.find('[id="boonsbanes"]').val(),
                  characterbuffs,
                  html.find('[id="modifier"]').val()
                )
            },
            cancel: {
              icon: '<i class="fas fa-times"></i>',
              label: game.i18n.localize('DL.DialogCancel'),
              callback: () => {}
            }
          },
          default: 'roll',
          close: () => {}
        })
        d.render(true)
      } else {
        this.rollAttack(item, 0, characterbuffs, 0)
      }
    }
  }

  rollAttack (weapon, boonsbanes, buffs, modifier) {
    const target = this.getTarget()
    let diceformular = '1d20'
    let attackRoll = null

    // Roll Against Target
    const targetNumber = this.getTargetNumber(weapon)

    // Add Attribute modifer to roll
    const attackAttribute = weapon.data.data.action?.attack
    const attribute = this.data.data?.attributes[attackAttribute.toLowerCase()]

    if (attackAttribute) {
      // Roll for Attack
      if (attribute && attribute.modifier != 0) {
        diceformular =
          diceformular +
          (attribute.modifier > 0
            ? '+' + attribute.modifier
            : attribute.modifier)
      }

      // Add weapon boonsbanes
      if (weapon.data.data.action.boonsbanes != 0) {
        boonsbanes =
          parseInt(boonsbanes) + parseInt(weapon.data.data.action.boonsbanes)
      }

      // Add buffs from Talents
      if (attackAttribute === 'Strength' && buffs.attackstrengthbonus != 0) {
        boonsbanes = parseInt(boonsbanes) + parseInt(buffs.attackstrengthbonus)
      }
      if (attackAttribute === 'Agility' && buffs.attackagilitybonus != 0) {
        boonsbanes = parseInt(boonsbanes) + parseInt(buffs.attackagilitybonus)
      }
      if (attackAttribute === 'Intellect' && buffs.attackintellectbonus != 0) {
        boonsbanes = parseInt(boonsbanes) + parseInt(buffs.attackintellectbonus)
      }
      if (attackAttribute === 'Will' && buffs.attackwillbonus != 0) {
        boonsbanes = parseInt(boonsbanes) + parseInt(buffs.attackwillbonus)
      }
      if (
        attackAttribute === 'Perception' &&
        buffs.attackperceptionbonus != 0
      ) {
        boonsbanes =
          parseInt(boonsbanes) + parseInt(buffs.attackperceptionbonus)
      }

      // If you wear a weapon and do not meet or exceed its requirements: -1 Bane
      if (weapon.data.data.wear) {
        if (
          weapon.data.data.strengthmin != '' &&
          parseInt(weapon.data.data.strengthmin) >
            parseInt(this.data.data?.attributes?.strength?.value)
        ) {
          boonsbanes--
        }
      }

      if (boonsbanes == undefined || isNaN(boonsbanes) || boonsbanes == 0) {
        boonsbanes = 0
      } else {
        diceformular += '+' + boonsbanes + 'd6kh'
      }

      if (modifier != 0) {
        diceformular = diceformular + '+' + parseInt(modifier)
      }

      attackRoll = new Roll(diceformular, {})
      attackRoll.roll()
    } else {
      ui.notifications.error(
        game.i18n.localize('DL.DialogWarningWeaponAttackModifier')
      )
    }

    // Format Dice
    const diceData = isNewerVersion(game.data.version, '0.6.9')
      ? FormatDice(attackRoll)
      : FormatDiceOld(attackRoll)

    // Plus20 roll
    let plus20 = false
    if (targetNumber != undefined && attackRoll != null) {
      plus20 = !!(
        attackRoll._total >= 20 &&
        attackRoll._total >= parseInt(targetNumber) + 5
      )
    }

    let resultText =
      attackRoll != null &&
      targetNumber != undefined &&
      attackRoll._total >= parseInt(targetNumber)
        ? game.i18n.localize('DL.DiceResultSuccess')
        : game.i18n.localize('DL.DiceResultFailure')
    let diceTotal = attackRoll != null ? attackRoll._total : ''
    if (
      this.data.type === 'creature' &&
      !game.settings.get('demonlord', 'attackShowAttack')
    ) {
      diceTotal = '?'
      resultText = ''
    }

    const againstNumber =
      (target != null && target.actor.data.type == 'character') ||
      (game.settings.get('demonlord', 'attackShowDefense') &&
        targetNumber != undefined)
        ? targetNumber
        : '?'

    var templateData = {
      actor: this,
      item: {
        data: weapon,
        name: weapon.name
      },
      data: {
        diceTotal: {
          value: diceTotal
        },
        diceTotalGM: {
          value: attackRoll != null ? attackRoll._total : ''
        },
        resultText: {
          value: resultText
        },
        didHit: {
          value: !!(
            targetNumber == undefined ||
            (attackRoll != null && attackRoll._total >= targetNumber)
          )
        },
        attack: {
          value: attackAttribute
            ? game.i18n.localize(
                CONFIG.DL.attributes[
                  attackAttribute.toLowerCase()
                ].toUpperCase()
              )
            : ''
        },
        against: {
          value: weapon.data?.data?.action?.against
            ? game.i18n.localize(
                CONFIG.DL.attributes[
                  weapon.data?.data?.action?.against.toLowerCase()
                ].toUpperCase()
              )
            : ''
        },
        againstNumber: {
          value: againstNumber
        },
        againstNumberGM: {
          value: againstNumber == '?' ? targetNumber : againstNumber
        },
        damageFormular: {
          value: weapon.data.data.action.damage + buffs.attackdamagebonus
        },
        damageType: {
          value: weapon.data.data.action.damagetype
        },
        damageTypes: {
          value: weapon.data.data.action.damagetypes
        },
        damageExtra20plusFormular: {
          value:
            buffs.attack20plusdamagebonus.charAt(0) == '+'
              ? buffs.attack20plusdamagebonus.substr(1)
              : buffs.attack20plusdamagebonus
        },
        description: {
          value: weapon.data.data.description
        },
        targetname: {
          value: target != null ? target.name : ''
        },
        effects: {
          value: buffs.attackeffects
        },
        armorEffects: {
          value: this.buildArmorEffects(!buffs.armorRequirementMeet)
        },
        afflictionEffects: {
          value: this.buildAfflictionsEffects('ATTACK')
        },
        isCreature: {
          value: this.data.type == 'creature'
        },
        isPlus20Roll: {
          value: plus20
        },
        hasTarget: {
          value: targetNumber != undefined
        },
        actionEffects: { value: this.buildActionEffects('ATTACK') }
      },
      diceData
    }

    const chatData = {
      user: game.user._id,
      speaker: {
        actor: this._id,
        token: this.token,
        alias: this.name
      }
    }

    const rollMode = game.settings.get('core', 'rollMode')
    if (['gmroll', 'blindroll'].includes(rollMode)) {
      chatData.whisper = ChatMessage.getWhisperRecipients('GM')
    }

    const template = 'systems/demonlord/templates/chat/combat.html'
    renderTemplate(template, templateData).then((content) => {
      chatData.content = content

      if (game.dice3d && attackRoll != null) {
        if (
          this.data.type === 'creature' &&
          !game.settings.get('demonlord', 'attackShowAttack')
        ) {
          if (attackRoll != null) chatData.sound = CONFIG.sounds.dice
          ChatMessage.create(chatData)
        } else {
          game.dice3d
            .showForRoll(
              attackRoll,
              game.user,
              true,
              chatData.whisper,
              chatData.blind
            )
            .then((displayed) => ChatMessage.create(chatData))
        }
      } else {
        if (attackRoll != null) chatData.sound = CONFIG.sounds.dice
        ChatMessage.create(chatData)
      }
    })
    /*
        } else {
            ui.notifications.info(game.i18n.localize('DL.DialogWarningTargetNotSelected'));
        }
        */
  }

  rollTalent (itemId, options = { event: null }) {
    if (this.data.data.afflictions.dazed) {
      ui.notifications.error(game.i18n.localize('DL.DialogWarningDazedFailer'))
    } else if (this.data.data.afflictions.defenseless) {
      ui.notifications.error(
        game.i18n.localize('DL.DialogWarningDefenselessFailer')
      )
    } else if (this.data.data.afflictions.surprised) {
      ui.notifications.error(
        game.i18n.localize('DL.DialogWarningSurprisedFailer')
      )
    } else if (this.data.data.afflictions.stunned) {
      ui.notifications.error(
        game.i18n.localize('DL.DialogWarningStunnedFailer')
      )
    } else if (this.data.data.afflictions.unconscious) {
      ui.notifications.error(
        game.i18n.localize('DL.DialogWarningUnconsciousFailer')
      )
    } else {
      const item = duplicate(this.getEmbeddedEntity('OwnedItem', itemId))
      const uses = parseInt(item.data?.uses?.value)
      const usesmax = parseInt(item.data?.uses?.max)

      if ((uses == 0 && usesmax == 0) || uses != usesmax) {
        if (item.data?.vs?.attribute) {
          const d = new Dialog({
            title:
              game.i18n.localize('DL.TalentVSRoll') +
              game.i18n.localize(item.name),
            content:
              '<div class="challengedialog"><b>' +
              game.i18n.localize('DL.DialogAddBonesAndBanes') +
              "</b><input id='boonsbanes' style='width: 50px;margin-left: 5px;text-align: center' type='text' value=0 data-dtype='Number'/>" +
              '</div><br/><div class="challengedialog"><b>' +
              game.i18n.localize('DL.ModsAdd') +
              "<input id='modifier' style='width: 50px;margin-left: 5px;text-align: center' type='text' value=0 data-dtype='Number'/>" +
              '</b></div><br/>',
            buttons: {
              roll: {
                icon: '<i class="fas fa-check"></i>',
                label: game.i18n.localize('DL.DialogRoll'),
                callback: (html) =>
                  this.useTalent(
                    item,
                    html.find('[id="boonsbanes"]').val(),
                    html.find('[id="modifier"]').val()
                  )
              },
              cancel: {
                icon: '<i class="fas fa-times"></i>',
                label: game.i18n.localize('DL.DialogCancel'),
                callback: () => {}
              }
            },
            default: 'roll',
            close: () => {}
          })
          d.render(true)
        } else {
          this.useTalent(item, null, 0)
        }
      } else {
        ui.notifications.warn(game.i18n.localize('DL.TalentMaxUsesReached'))
      }
    }
  }

  useTalent (talent, boonsbanes, modifier) {
    const target = this.getTarget()
    let diceformular = '1d20'
    let roll = false
    let attackRoll = null
    let attackAttribute = ''
    let targetNumber = 0
    let usesText = ''
    let damageformular = ''
    let diceData = ''

    // Generate Character Buffs
    const buffs = this.generateCharacterBuffs('TALENT')

    if (talent.data?.vs?.attribute) {
      targetNumber = this.getVSTargetNumber(talent)

      // if (targetNumber != undefined) {
      if (talent.data.vs?.damageactive) {
        this.activateTalent(talent, true)
      } else {
        this.activateTalent(talent, false)
      }

      attackAttribute = talent.data.vs.attribute
      const attribute = this.data.data.attributes[attackAttribute.toLowerCase()]

      if (attackAttribute) {
        if (attribute && attribute.modifier != 0) {
          diceformular +=
            attribute.modifier > 0
              ? '+' + attribute.modifier
              : attribute.modifier
        }
        roll = true

        // Add boonsbanes
        if (talent.data.vs.boonsbanes != 0) {
          boonsbanes =
            parseInt(boonsbanes) + parseInt(talent.data.vs.boonsbanes)
        }

        // Challenge: Add buffs from Talents
        if (
          attackAttribute === 'Strength' &&
          buffs.challengestrengthbonus != 0
        ) {
          boonsbanes =
            parseInt(boonsbanes) + parseInt(buffs.challengestrengthbonus)
        }
        if (attackAttribute === 'Agility' && buffs.challengeagilitybonus != 0) {
          boonsbanes =
            parseInt(boonsbanes) + parseInt(buffs.challengeagilitybonus)
        }
        if (
          attackAttribute === 'Intellect' &&
          buffs.challengeintellectbonus != 0
        ) {
          boonsbanes =
            parseInt(boonsbanes) + parseInt(buffs.challengeintellectbonus)
        }
        if (attackAttribute === 'Will' && buffs.challengewillbonus != 0) {
          boonsbanes = parseInt(boonsbanes) + parseInt(buffs.challengewillbonus)
        }
        if (
          attackAttribute === 'Perception' &&
          buffs.challengeperceptionbonus != 0
        ) {
          boonsbanes =
            parseInt(boonsbanes) + parseInt(buffs.challengeperceptionbonus)
        }

        if (boonsbanes == undefined || isNaN(boonsbanes) || boonsbanes == 0) {
          boonsbanes = 0
        } else {
          diceformular += '+' + boonsbanes + 'd6kh'
        }

        if (modifier != 0) {
          diceformular = diceformular + '+' + parseInt(modifier)
        }

        attackRoll = new Roll(diceformular, {})
        attackRoll.roll()

        // Format Dice
        diceData = isNewerVersion(game.data.version, '0.6.9')
          ? FormatDice(attackRoll)
          : FormatDiceOld(attackRoll)

        // Roll Against Target
        targetNumber = this.getVSTargetNumber(talent)
      }

      if (talent.data.vs.damageactive && talent.data.vs.damage) {
        damageformular = talent.data.vs.damage
      }
      /*
            } else {
                ui.notifications.info(game.i18n.localize('DL.DialogWarningTargetNotSelected'));
            }
            */
    } else {
      this.activateTalent(talent, true)
    }

    /*
        if (talent.data?.damage && target == null) {
            ui.notifications.info(game.i18n.localize('DL.DialogWarningTargetNotSelected'));
        }
        */

    if (
      parseInt(talent.data?.uses?.value) >= 0 &&
      parseInt(talent.data?.uses?.max) > 0
    ) {
      const uses = parseInt(talent.data.uses?.value)
      const usesmax = parseInt(talent.data.uses?.max)
      usesText =
        game.i18n.localize('DL.TalentUses') + ': ' + uses + ' / ' + usesmax
    }

    let resultText =
      attackRoll != null &&
      targetNumber != undefined &&
      attackRoll._total >= parseInt(targetNumber)
        ? game.i18n.localize('DL.DiceResultSuccess')
        : game.i18n.localize('DL.DiceResultFailure')
    let diceTotal = attackRoll != null ? attackRoll._total : ''
    if (
      this.data.type === 'creature' &&
      !game.settings.get('demonlord', 'attackShowAttack')
    ) {
      diceTotal = '?'
      resultText = ''
    }

    const againstNumber =
      (target != null && target.actor?.data.type == 'character') ||
      (game.settings.get('demonlord', 'attackShowDefense') &&
        targetNumber != undefined)
        ? targetNumber
        : '?'

    var templateData = {
      actor: this,
      item: talent,
      data: {
        id: {
          value: talent._id
        },
        roll: {
          value: roll
        },
        diceTotal: {
          value: diceTotal
        },
        diceTotalGM: {
          value: attackRoll != null ? attackRoll._total : ''
        },
        resultText: {
          value: resultText
        },
        didHit: {
          value: !!(
            targetNumber != undefined || attackRoll._total >= targetNumber
          )
        },
        attack: {
          value: attackAttribute
            ? game.i18n.localize(
                CONFIG.DL.attributes[
                  attackAttribute.toLowerCase()
                ].toUpperCase()
              )
            : ''
        },
        against: {
          value: talent.data?.vs?.against
            ? game.i18n.localize(
                CONFIG.DL.attributes[
                  talent.data?.vs?.against.toLowerCase()
                ].toUpperCase()
              )
            : ''
        },
        againstNumber: {
          value: againstNumber
        },
        againstNumberGM: {
          value: againstNumber == '?' ? targetNumber : againstNumber
        },
        damageFormular: {
          value: damageformular
        },
        damageType: {
          value:
            talent.data.vs.damageactive && talent.data.vs.damage
              ? talent.data?.vs?.damagetype
              : talent.data?.action.damagetype
        },
        damageTypes: {
          value: talent.data?.vs.damagetypes
        },
        damageExtra20plusFormular: {
          value: talent.data?.action?.plus20
        },
        effects: {
          value: this.buildTalentEffects(talent, false, 'TALENT')
        },
        description: {
          value: talent.data?.description
        },
        uses: {
          value: usesText
        },
        healing: {
          value:
            talent.data?.healing?.healactive && talent.data?.healing?.healing
              ? talent.data?.healing?.healing
              : false
        },
        targetname: {
          value: target != null ? target.name : ''
        },
        isCreature: {
          value: this.data.type == 'creature'
        },
        pureDamage: {
          value: talent.data?.damage
        },
        pureDamageType: {
          value: talent.data?.action.damagetype
        },
        afflictionEffects: {
          value: this.buildAfflictionsEffects('SPELL')
        }
      },
      diceData
    }

    const chatData = {
      user: game.user._id,
      speaker: {
        actor: this._id,
        token: this.token,
        alias: this.name
      }
    }

    const rollMode = game.settings.get('core', 'rollMode')
    if (['gmroll', 'blindroll'].includes(rollMode)) {
      chatData.whisper = ChatMessage.getWhisperRecipients('GM')
    }

    if (
      talent.data?.damage ||
      talent.data?.vs?.attribute ||
      (!talent.data?.vs?.attribute && !talent.data?.damage)
    ) {
      const template = 'systems/demonlord/templates/chat/talent.html'
      renderTemplate(template, templateData).then((content) => {
        chatData.content = content
        if (game.dice3d && attackRoll != null) {
          if (
            this.data.type === 'creature' &&
            !game.settings.get('demonlord', 'attackShowAttack')
          ) {
            if (attackRoll != null) chatData.sound = CONFIG.sounds.dice
            ChatMessage.create(chatData)
          } else {
            game.dice3d
              .showForRoll(
                attackRoll,
                game.user,
                true,
                chatData.whisper,
                chatData.blind
              )
              .then((displayed) => ChatMessage.create(chatData))
          }
        } else {
          if (attackRoll != null) {
            chatData.sound = CONFIG.sounds.dice
          }
          ChatMessage.create(chatData)
        }
      })
    }
  }

  rollSpell (itemId, options = { event: null }) {
    if (this.data.data.afflictions.dazed) {
      ui.notifications.error(game.i18n.localize('DL.DialogWarningDazedFailer'))
    } else if (this.data.data.afflictions.defenseless) {
      ui.notifications.error(
        game.i18n.localize('DL.DialogWarningDefenselessFailer')
      )
    } else if (this.data.data.afflictions.surprised) {
      ui.notifications.error(
        game.i18n.localize('DL.DialogWarningSurprisedFailer')
      )
    } else if (this.data.data.afflictions.stunned) {
      ui.notifications.error(
        game.i18n.localize('DL.DialogWarningStunnedFailer')
      )
    } else if (this.data.data.afflictions.unconscious) {
      ui.notifications.error(
        game.i18n.localize('DL.DialogWarningUnconsciousFailer')
      )
    } else {
      const item = duplicate(this.getEmbeddedEntity('OwnedItem', itemId))
      const attackAttribute = item.data?.action?.attack
      const uses = parseInt(item.data?.castings?.value)
      const usesmax = parseInt(item.data?.castings?.max)
      const characterbuffs = this.generateCharacterBuffs('SPELL')

      if ((uses == 0 && usesmax == 0) || uses != usesmax) {
        if (attackAttribute) {
          if (item.data.spelltype == game.i18n.localize('DL.SpellTypeAttack')) {
            const d = new Dialog({
              title:
                game.i18n.localize('DL.DialogSpellRoll') +
                game.i18n.localize(item.name),
              content:
                '<div class="challengedialog"><b>' +
                game.i18n.localize('DL.DialogAddBonesAndBanes') +
                "</b><input id='boonsbanes' style='width: 50px;margin-left: 5px;text-align: center' type='text' value=0 data-dtype='Number'/>" +
                '</div><br/><div class="challengedialog"><b>' +
                game.i18n.localize('DL.ModsAdd') +
                "<input id='modifier' style='width: 50px;margin-left: 5px;text-align: center' type='text' value=0 data-dtype='Number'/>" +
                '</b></div><br/>',
              buttons: {
                roll: {
                  icon: '<i class="fas fa-check"></i>',
                  label: game.i18n.localize('DL.DialogRoll'),
                  callback: (html) =>
                    this.useSpell(
                      item,
                      html.find('[id="boonsbanes"]').val(),
                      characterbuffs,
                      html.find('[id="modifier"]').val()
                    )
                },
                cancel: {
                  icon: '<i class="fas fa-times"></i>',
                  label: game.i18n.localize('DL.DialogCancel'),
                  callback: () => {}
                }
              },
              default: 'roll',
              close: () => {}
            })
            d.render(true)
          } else {
            this.useSpell(item, 0, characterbuffs, 0)
          }
        } else {
          this.useSpell(item, 0, characterbuffs, 0)
        }
      } else {
        ui.notifications.warn(game.i18n.localize('DL.SpellMaxUsesReached'))
      }
    }
  }

  useSpell (spell, boonsbanes, buffs, modifier) {
    const target = this.getTarget()
    let diceformular = '1d20'
    let usesText = ''

    // Add Attribute modifer to roll
    const attackAttribute = spell.data?.action?.attack
    const attribute = this.data.data.attributes[attackAttribute.toLowerCase()]

    const defenseAttribute = spell.data?.action?.defense
    const challStrength = defenseAttribute == 'Strength'
    const challAgility = defenseAttribute == 'Agility'
    const challIntellect = defenseAttribute == 'Intellect'
    const challWill = defenseAttribute == 'Will'
    const challPerception = defenseAttribute == 'Perception'

    // Challenge: Add buffs from Talents
    if (challStrength && buffs.challengestrengthbonus != 0) {
      boonsbanes = parseInt(boonsbanes) + parseInt(buffs.challengestrengthbonus)
    }
    if (challAgility && buffs.challengeagilitybonus != 0) {
      boonsbanes = parseInt(boonsbanes) + parseInt(buffs.challengeagilitybonus)
    }
    if (challIntellect && buffs.challengeintellectbonus != 0) {
      boonsbanes =
        parseInt(boonsbanes) + parseInt(buffs.challengeintellectbonus)
    }
    if (challWill && buffs.challengewillbonus != 0) {
      boonsbanes = parseInt(boonsbanes) + parseInt(buffs.challengewillbonus)
    }
    if (challPerception && buffs.challengeperceptionbonus != 0) {
      boonsbanes =
        parseInt(boonsbanes) + parseInt(buffs.challengeperceptionbonus)
    }

    // Roll for Attack
    if (attribute && attribute.modifier != 0) {
      diceformular =
        diceformular +
        (attribute.modifier > 0 ? '+' + attribute.modifier : attribute.modifier)
    }

    // Add spell attack boonsbanes
    if (spell.data?.action?.boonsbanes != 0) {
      boonsbanes =
        parseInt(boonsbanes) + parseInt(spell.data?.action?.boonsbanes)
    }

    // Attack: Add buffs from Talents
    if (attackAttribute === 'Strength' && buffs.attackstrengthbonus != 0) {
      boonsbanes = parseInt(boonsbanes) + parseInt(buffs.attackstrengthbonus)
    }
    if (attackAttribute === 'Agility' && buffs.attackagilitybonus != 0) {
      boonsbanes = parseInt(boonsbanes) + parseInt(buffs.attackagilitybonus)
    }
    if (attackAttribute === 'Intellect' && buffs.attackintellectbonus != 0) {
      boonsbanes = parseInt(boonsbanes) + parseInt(buffs.attackintellectbonus)
    }
    if (attackAttribute === 'Will' && buffs.attackwillbonus != 0) {
      boonsbanes = parseInt(boonsbanes) + parseInt(buffs.attackwillbonus)
    }
    if (attackAttribute === 'Perception' && buffs.attackperceptionbonus != 0) {
      boonsbanes = parseInt(boonsbanes) + parseInt(buffs.attackperceptionbonus)
    }

    if (boonsbanes == undefined || isNaN(boonsbanes) || boonsbanes == 0) {
      boonsbanes = 0
    } else {
      diceformular += '+' + boonsbanes + 'd6kh'
    }

    if (modifier != 0) {
      diceformular = diceformular + '+' + parseInt(modifier)
    }

    const attackRoll = new Roll(diceformular, {})
    attackRoll.roll()

    // Format Dice
    const diceData = isNewerVersion(game.data.version, '0.6.9')
      ? FormatDice(attackRoll)
      : FormatDiceOld(attackRoll)

    // Roll Against Target
    const targetNumber = this.getTargetNumber(spell)

    // Plus20 roll
    const plus20 = attackRoll._total >= 20

    // Effect Dice roll
    let effectdice = ''
    if (spell.data.effectdice != '' && spell.data.effectdice != undefined) {
      const effectRoll = new Roll(spell.data.effectdice, {})
      effectRoll.roll()
      effectdice = effectRoll._total
    }

    if (
      parseInt(spell.data?.castings?.value) >= 0 &&
      parseInt(spell.data?.castings?.max) > 0
    ) {
      let uses = parseInt(spell.data?.castings?.value)
      const usesmax = parseInt(spell.data?.castings?.max)

      if (uses < usesmax) {
        spell.data.castings.value = Number(uses) + 1
        uses++
      } else {
        spell.data.castings.value = 0
      }
      this.updateEmbeddedEntity('OwnedItem', spell)

      usesText =
        game.i18n.localize('DL.SpellCastingsUses') +
        ': ' +
        uses +
        ' / ' +
        usesmax
    }

    let resultText =
      attackRoll != null &&
      targetNumber != undefined &&
      attackRoll._total >= parseInt(targetNumber)
        ? game.i18n.localize('DL.DiceResultSuccess')
        : game.i18n.localize('DL.DiceResultFailure')
    let diceTotal = attackRoll != null ? attackRoll._total : ''
    if (
      this.data.type === 'creature' &&
      !game.settings.get('demonlord', 'attackShowAttack')
    ) {
      diceTotal = '?'
      resultText = ''
    }

    const againstNumber =
      (target != null && target.actor?.data.type == 'character') ||
      (game.settings.get('demonlord', 'attackShowDefense') &&
        targetNumber != undefined)
        ? targetNumber
        : '?'

    var templateData = {
      actor: this,
      item: {
        data: spell,
        name: spell.name
      },
      data: {
        id: {
          value: spell._id
        },
        diceTotal: {
          value: diceTotal
        },
        diceTotalGM: {
          value: attackRoll != null ? attackRoll._total : ''
        },
        resultText: {
          value: resultText
        },
        didHit: {
          value: attackRoll._total >= targetNumber
        },
        attack: {
          value: attackAttribute
            ? game.i18n.localize(
                CONFIG.DL.attributes[
                  attackAttribute.toLowerCase()
                ].toUpperCase()
              )
            : ''
        },
        against: {
          value: spell.data.action?.against
            ? game.i18n.localize(
                CONFIG.DL.attributes[
                  spell.data.action?.against.toLowerCase()
                ].toUpperCase()
              )
            : ''
        },
        againstNumber: {
          value: againstNumber
        },
        againstNumberGM: {
          value: againstNumber == '?' ? targetNumber : againstNumber
        },
        damageFormular: {
          value: spell.data.action?.damage
        },
        damageType: {
          value: spell.data.action?.damagetype
        },
        damageTypes: {
          value: spell.data?.action?.damagetypes
        },
        damageExtra20plusFormular: {
          value: spell.data.action?.plus20damage
        },
        attribute: {
          value: spell.data?.attribute
        },
        plus20: {
          value: plus20
        },
        plus20text: {
          value: spell.data?.action?.plus20
        },
        description: {
          value: spell.data?.description
        },
        spellcastings: {
          value: spell.data?.castings?.max
        },
        spellduration: {
          value: spell.data?.duration
        },
        spelltarget: {
          value: spell.data?.target
        },
        spellarea: {
          value: spell.data?.area
        },
        spellrequirements: {
          value: spell.data?.requirements
        },
        spellsacrifice: {
          value: spell.data?.sacrifice
        },
        spellpermanence: {
          value: spell.data?.permanence
        },
        spellspecial: {
          value: spell.data?.special
        },
        spelltriggered: {
          value: spell.data?.triggered
        },
        tagetname: {
          value: target != null ? target.name : ''
        },
        effectdice: {
          value: effectdice
        },
        defense: {
          value: spell.data?.action?.defense
        },
        defenseboonsbanes: {
          value: parseInt(spell.data?.action?.defenseboonsbanes)
        },
        challStrength: {
          value: challStrength
        },
        challAgility: {
          value: challAgility
        },
        challIntellect: {
          value: challIntellect
        },
        challWill: {
          value: challWill
        },
        challPerception: {
          value: challPerception
        },
        uses: {
          value: usesText
        },
        isCreature: {
          value: this.data.type == 'creature'
        },
        healing: {
          value:
            spell.data?.healing?.healactive && spell.data?.healing?.healing
              ? spell.data?.healing?.healing
              : false
        },
        effects: {
          value: buffs.attackeffects
        },
        afflictionEffects: {
          value: this.buildAfflictionsEffects('SPELL')
        }
      },
      diceData
    }

    const chatData = {
      user: game.user._id,
      speaker: {
        actor: this._id,
        token: this.token,
        alias: this.name
      }
    }

    const rollMode = game.settings.get('core', 'rollMode')
    if (['gmroll', 'blindroll'].includes(rollMode)) {
      chatData.whisper = ChatMessage.getWhisperRecipients('GM')
    }

    const template = 'systems/demonlord/templates/chat/spell.html'
    renderTemplate(template, templateData).then((content) => {
      chatData.content = content
      if (game.dice3d && attackRoll != null && attackAttribute) {
        if (
          this.data.type === 'creature' &&
          !game.settings.get('demonlord', 'attackShowAttack')
        ) {
          if (attackRoll != null) chatData.sound = CONFIG.sounds.dice
          ChatMessage.create(chatData)
        } else {
          game.dice3d
            .showForRoll(
              attackRoll,
              game.user,
              true,
              chatData.whisper,
              chatData.blind
            )
            .then((displayed) => ChatMessage.create(chatData))
        }
      } else {
        if (attackRoll != null && attackAttribute) {
          chatData.sound = CONFIG.sounds.dice
        }
        ChatMessage.create(chatData)
      }
    })
  }

  rollCorruption () {
    const corruptionRoll = new Roll('1d20-', {})
    corruptionRoll.roll()

    // Format Dice
    const diceData = isNewerVersion(game.data.version, '0.6.9')
      ? FormatDice(corruptionRoll)
      : FormatDiceOld(corruptionRoll)

    var templateData = {
      actor: this,
      data: {
        diceTotal: {
          value: corruptionRoll._total
        },
        tagetValueText: {
          value: game.i18n.localize('DL.CharCorruption').toUpperCase()
        },
        targetValue: {
          value: this.data.data.characteristics.corruption
        },
        resultText: {
          value:
            corruptionRoll._total >= this.data.data.characteristics.corruption
              ? game.i18n.localize('DL.DiceResultSuccess')
              : game.i18n.localize('DL.DiceResultFailure')
        },
        failureText: {
          value:
            corruptionRoll._total >= this.data.data.characteristics.corruption
              ? ''
              : game.i18n.localize('DL.CharRolCorruptionResult')
        }
      },
      diceData
    }

    const chatData = {
      user: game.user._id,
      speaker: {
        actor: this._id,
        token: this.token,
        alias: this.name
      }
    }

    const rollMode = game.settings.get('core', 'rollMode')
    if (['gmroll', 'blindroll'].includes(rollMode)) {
      chatData.whisper = ChatMessage.getWhisperRecipients('GM')
    }

    const template = 'systems/demonlord/templates/chat/corruption.html'
    renderTemplate(template, templateData).then((content) => {
      chatData.content = content
      if (game.dice3d) {
        game.dice3d
          .showForRoll(
            corruptionRoll,
            game.user,
            true,
            chatData.whisper,
            chatData.blind
          )
          .then((displayed) =>
            ChatMessage.create(chatData).then((msg) => {
              if (
                corruptionRoll._total <
                this.data.data.characteristics.corruption
              ) {
                ;(async () => {
                  const compRollTabels = await game.packs
                    .get('demonlord.sotdl roll tabels')
                    .getContent()
                  const tableMarkOfDarkness = compRollTabels.find(
                    (i) => i.name === 'Mark of Darkness'
                  )

                  const result = tableMarkOfDarkness.draw()
                  let resultText = ''
                  const actor = this

                  result.then(function (result) {
                    resultText = result.results[0].text

                    actor.createOwnedItem({
                      name: 'Mark of Darkness',
                      type: 'feature',
                      data: {
                        description: resultText
                      }
                    })
                  })
                  // tableMarkOfDarkness.roll().results[0].text
                })()
              }
            })
          )
      } else {
        chatData.sound = CONFIG.sounds.dice
        ChatMessage.create(chatData)
      }
    })
  }

  showItemInfo (item) {
    const uses = parseInt(item.data?.data?.enchantment?.uses?.value)
    const usesmax = parseInt(item.data?.data?.enchantment?.uses?.max)

    const usesText =
      game.i18n.localize('DL.SpellCastingsUses') + ': ' + uses + ' / ' + usesmax

    var templateData = {
      actor: this,
      item: {
        data: item,
        name: item.name
      },
      data: {
        uses: {
          value: usesText
        },
        healing: {
          value: item.data?.data?.healingoption
        }
      }
    }

    const chatData = {
      user: game.user._id,
      speaker: {
        actor: this._id,
        token: this.token,
        alias: this.name
      }
    }

    const rollMode = game.settings.get('core', 'rollMode')
    if (['gmroll', 'blindroll'].includes(rollMode)) {
      chatData.whisper = ChatMessage.getWhisperRecipients('GM')
    }

    const template = 'systems/demonlord/templates/chat/enchantment.html'
    renderTemplate(template, templateData).then((content) => {
      chatData.content = content
      ChatMessage.create(chatData)
    })
  }

  getTarget () {
    let selectedTarget = null
    game.user.targets.forEach(async (target) => {
      selectedTarget = target
    })

    return selectedTarget
  }

  getTargetNumber (item) {
    let tagetNumber
    game.user.targets.forEach(async (target) => {
      const targetActor = target.actor
      if (targetActor) {
        let againstSelectedAttribute = item.data.data?.action?.against?.toLowerCase()

        if (againstSelectedAttribute == undefined) {
          againstSelectedAttribute = item.data.action?.against?.toLowerCase()
        }

        if (againstSelectedAttribute == 'defense') {
          tagetNumber = targetActor.data.data?.characteristics?.defense
        } else {
          tagetNumber =
            targetActor.data.data?.attributes[againstSelectedAttribute]?.value
        }
      }
    })

    return tagetNumber
  }

  getVSTargetNumber (talent) {
    let tagetNumber

    game.user.targets.forEach(async (target) => {
      const targetActor = target.actor
      if (targetActor) {
        const againstSelectedAttribute = talent.data.vs.against.toLowerCase()

        if (againstSelectedAttribute == 'defense') {
          tagetNumber = targetActor.data.data.characteristics.defense
        } else {
          tagetNumber =
            targetActor.data.data.attributes[againstSelectedAttribute].value
        }
      }
    })

    return tagetNumber
  }

  generateCharacterBuffs (type) {
    const characterbuffs = new CharacterBuff()
    characterbuffs.challengestrengthbonus = 0
    characterbuffs.challengeagilitybonus = 0
    characterbuffs.challengeintellectbonus = 0
    characterbuffs.challengewillbonus = 0
    characterbuffs.challengeperceptionbonus = 0
    characterbuffs.attackstrengthbonus = 0
    characterbuffs.attackagilitybonus = 0
    characterbuffs.attackintellectbonus = 0
    characterbuffs.attackwillbonus = 0
    characterbuffs.attackperceptionbonus = 0

    if (this.data.data.actions.prepare) {
      characterbuffs.challengestrengthbonus++
      characterbuffs.challengeagilitybonus++
      characterbuffs.challengeintellectbonus++
      characterbuffs.challengewillbonus++
      characterbuffs.challengeperceptionbonus++
      characterbuffs.attackstrengthbonus++
      characterbuffs.attackagilitybonus++
      characterbuffs.attackintellectbonus++
      characterbuffs.attackwillbonus++
      characterbuffs.attackperceptionbonus++
    }

    const talents = this.getEmbeddedCollection('OwnedItem').filter(
      (e) => e.type === 'talent'
    )

    for (const talent of talents) {
      if (talent.data.addtonextroll) {
        // console.log(talent.name)
        if (talent.data.action?.boonsbanesactive) {
          characterbuffs.attackbonus =
            parseInt(characterbuffs.attackbonus) +
            parseInt(talent.data.action?.boonsbanes)

          if (talent.data.action.strengthboonsbanesselect) {
            characterbuffs.attackstrengthbonus += parseInt(
              talent.data.action?.boonsbanes
            )
          }
          if (talent.data.action.agilityboonsbanesselect) {
            characterbuffs.attackagilitybonus += parseInt(
              talent.data.action?.boonsbanes
            )
          }
          if (talent.data.action.intellectboonsbanesselect) {
            characterbuffs.attackintellectbonus += parseInt(
              talent.data.action?.boonsbanes
            )
          }
          if (talent.data.action.willboonsbanesselect) {
            characterbuffs.attackwillbonus += parseInt(
              talent.data.action?.boonsbanes
            )
          }
          if (talent.data.action.perceptionboonsbanesselect) {
            characterbuffs.attackperceptionbonus += parseInt(
              talent.data.action?.boonsbanes
            )
          }
        }
        if (
          talent.data.action?.damageactive &&
          talent.data.action?.damage != ''
        ) {
          characterbuffs.attackdamagebonus += '+' + talent.data.action?.damage
        }
        if (
          talent.data.action?.plus20active &&
          talent.data.action?.plus20 != ''
        ) {
          characterbuffs.attack20plusdamagebonus +=
            '+' + talent.data.action?.plus20
        }

        if (type === 'ATTACK') {
          characterbuffs.attackeffects += this.buildTalentEffects(
            talent,
            true,
            type
          )
        } else if (type === 'SPELL') {
          characterbuffs.attackeffects += this.buildTalentEffects(
            talent,
            true,
            type
          )
        }

        if (talent.data?.challenge.boonsbanesactive) {
          characterbuffs.challengebonus =
            parseInt(characterbuffs.challengebonus) +
            parseInt(talent.data.challenge?.boonsbanes)

          if (talent.data.challenge.strengthboonsbanesselect) {
            characterbuffs.challengestrengthbonus += parseInt(
              talent.data.challenge?.boonsbanes
            )
            characterbuffs.challengeeffects += this.buildTalentEffects(
              talent,
              true,
              type
            )
          }
          if (talent.data.challenge.agilityboonsbanesselect) {
            characterbuffs.challengeagilitybonus += parseInt(
              talent.data.challenge?.boonsbanes
            )
            characterbuffs.challengeeffects += this.buildTalentEffects(
              talent,
              true,
              type
            )
          }
          if (talent.data.challenge.intellectboonsbanesselect) {
            characterbuffs.challengeintellectbonus += parseInt(
              talent.data.challenge?.boonsbanes
            )
            characterbuffs.challengeeffects += this.buildTalentEffects(
              talent,
              true,
              type
            )
          }
          if (talent.data.challenge.willboonsbanesselect) {
            characterbuffs.challengewillbonus += parseInt(
              talent.data.challenge?.boonsbanes
            )
            characterbuffs.challengeeffects += this.buildTalentEffects(
              talent,
              true,
              type
            )
          }
          if (talent.data.challenge.perceptionboonsbanesselect) {
            characterbuffs.challengeperceptionbonus += parseInt(
              talent.data.challenge?.boonsbanes
            )
            characterbuffs.challengeeffects += this.buildTalentEffects(
              talent,
              true,
              type
            )
          }
        }
        if (
          talent.data.bonuses?.defenseactive &&
          talent.data.bonuses?.defense > 0
        ) {
          characterbuffs.defensebonus += parseInt(talent.data.bonuses.defense)
        }
        if (
          talent.data.bonuses?.healthactive &&
          talent.data.bonuses?.health > 0
        ) {
          characterbuffs.healthbonus += parseInt(talent.data.bonuses.health)
        }
        if (
          talent.data.bonuses?.speedactive &&
          talent.data.bonuses?.speed > 0
        ) {
          characterbuffs.speedbonus += parseInt(talent.data.bonuses.speed)
        }
        if (
          talent.data.bonuses?.poweractive &&
          talent.data.bonuses?.power > 0
        ) {
          characterbuffs.powerbonus += parseInt(talent.data.bonuses.power)
        }
        if (talent.data.healing?.healactive && talent.data.healing?.rate > 0) {
          characterbuffs.healing += parseInt(talent.data.healing.rate)
        }
      }
    }

    const items = this.getEmbeddedCollection('OwnedItem').filter(
      (e) => e.type === 'item'
    )
    let itemAttackbonus = 0
    let itemChallengebonus = 0
    let itemDamageBonus = ''
    let itemDefenseBonus = 0
    let itemSpeedBonus = 0
    let itemPerceptionBonus = 0

    for (const item of items) {
      if (item.data.wear) {
        if (item.data.enchantment?.attackbonus != null) {
          itemAttackbonus += parseInt(item.data.enchantment?.attackbonus)
        }
        if (item.data.enchantment?.challengebonus != null) {
          itemChallengebonus += parseInt(item.data.enchantment?.challengebonus)
        }
        if (item.data.enchantment?.damage != '') {
          itemDamageBonus += '+' + item.data.enchantment?.damage
        }
        if (item.data.enchantment?.defense != null) {
          itemDefenseBonus += parseInt(item.data.enchantment?.defense)
        }
        if (item.data.enchantment?.speed != null) {
          itemSpeedBonus += parseInt(item.data.enchantment?.speed)
        }
        if (item.data.enchantment?.perception != null) {
          itemPerceptionBonus += parseInt(item.data.enchantment?.perception)
        }
      }
    }
    characterbuffs.attackbonus += itemAttackbonus
    characterbuffs.challengebonus += itemChallengebonus
    characterbuffs.attackdamagebonus += itemDamageBonus
    characterbuffs.defensebonus += itemDefenseBonus
    characterbuffs.speedbonus += itemSpeedBonus
    characterbuffs.perception += itemPerceptionBonus

    // If you wear armor and do not meet or exceed its requirements: -1 Bane
    const armors = this.getEmbeddedCollection('OwnedItem').filter(
      (e) => e.type === 'armor'
    )
    let armorAttackbonus = 0
    for (const armor of armors) {
      if (armor.data.wear && !armor.data.isShield) {
        if (
          armor.data.strengthmin != '' &&
          parseInt(armor.data.strengthmin) >
            parseInt(this.data.data?.attributes?.strength?.value)
        ) {
          armorAttackbonus = -1
          characterbuffs.armorRequirementMeet = false
        }
      }
    }
    characterbuffs.attackbonus += armorAttackbonus

    const mods = this.getEmbeddedCollection('OwnedItem').filter(
      (e) => e.type === 'mod'
    )
    let modAttackbonus = 0
    let modChallengebonus = 0
    let modDamageBonus = ''
    let modDefenseBonus = 0
    let modHealingBonus = 0
    let modSpeedBonus = 0
    for (const mod of mods) {
      if (mod.data.active) {
        if (
          mod.data.modtype == game.i18n.localize('DL.TalentAttackBoonsBanes')
        ) {
          modAttackbonus += parseInt(mod.data.modifier)
        }
        if (
          mod.data.modtype == game.i18n.localize('DL.TalentChallengeBoonsBanes')
        ) {
          modChallengebonus += parseInt(mod.data.modifier)
        }
        if (mod.data.modtype == game.i18n.localize('DL.ModsListDamage')) {
          modDamageBonus += '+' + mod.data.modifier
        }
        if (mod.data.modtype == game.i18n.localize('DL.ItemDefenseModifier')) {
          modDefenseBonus += parseInt(mod.data.modifier)
        }
        if (mod.data.modtype == game.i18n.localize('DL.ModsListHealth')) {
          modHealingBonus += parseInt(mod.data.modifier)
        }
        if (mod.data.modtype == game.i18n.localize('DL.ModsListSpeed')) {
          modSpeedBonus += parseInt(mod.data.modifier)
        }
      }
    }
    characterbuffs.attackbonus += modAttackbonus
    characterbuffs.challengebonus += modChallengebonus
    characterbuffs.attackdamagebonus += modDamageBonus
    characterbuffs.defensebonus += modDefenseBonus
    characterbuffs.healthbonus += modHealingBonus
    characterbuffs.speedbonus += modSpeedBonus

    // Afflictions
    if (this.data.data.afflictions?.diseased) {
      characterbuffs.attackbonus += -1
      characterbuffs.attackstrengthbonus += -1
      characterbuffs.attackagilitybonus += -1
      characterbuffs.attackintellectbonus += -1
      characterbuffs.attackwillbonus += -1
      characterbuffs.attackperceptionbonus += -1

      characterbuffs.challengebonus += -1
      characterbuffs.challengestrengthbonus += -1
      characterbuffs.challengeagilitybonus += -1
      characterbuffs.challengeintellectbonus += -1
      characterbuffs.challengewillbonus += -1
      characterbuffs.challengeperceptionbonus += -1
    }
    if (this.data.data.afflictions?.frightened) {
      characterbuffs.attackbonus += -1
      characterbuffs.attackstrengthbonus += -1
      characterbuffs.attackagilitybonus += -1
      characterbuffs.attackintellectbonus += -1
      characterbuffs.attackwillbonus += -1
      characterbuffs.attackperceptionbonus += -1

      characterbuffs.challengebonus += -1
      characterbuffs.challengestrengthbonus += -1
      characterbuffs.challengeagilitybonus += -1
      characterbuffs.challengeintellectbonus += -1
      characterbuffs.challengewillbonus += -1
      characterbuffs.challengeperceptionbonus += -1
    }
    if (this.data.data.afflictions?.horrified) {
      characterbuffs.attackbonus += -3
      characterbuffs.attackstrengthbonus += -3
      characterbuffs.attackagilitybonus += -3
      characterbuffs.attackintellectbonus += -3
      characterbuffs.attackwillbonus += -3
      characterbuffs.attackperceptionbonus += -3

      characterbuffs.challengebonus += -3
      characterbuffs.challengestrengthbonus += -3
      characterbuffs.challengeagilitybonus += -3
      characterbuffs.challengeintellectbonus += -3
      characterbuffs.challengewillbonus += -3
      characterbuffs.challengeperceptionbonus += -3
    }
    if (this.data.data.afflictions?.fatigued) {
      characterbuffs.attackbonus += -1
      characterbuffs.attackstrengthbonus += -1
      characterbuffs.attackagilitybonus += -1
      characterbuffs.attackintellectbonus += -1
      characterbuffs.attackwillbonus += -1
      characterbuffs.attackperceptionbonus += -1

      characterbuffs.challengebonus += -1
      characterbuffs.challengestrengthbonus += -1
      characterbuffs.challengeagilitybonus += -1
      characterbuffs.challengeintellectbonus += -1
      characterbuffs.challengewillbonus += -1
      characterbuffs.challengeperceptionbonus += -1
    }
    if (this.data.data.afflictions?.impaired) {
      characterbuffs.attackbonus += -1
      characterbuffs.attackstrengthbonus += -1
      characterbuffs.attackagilitybonus += -1
      characterbuffs.attackintellectbonus += -1
      characterbuffs.attackwillbonus += -1
      characterbuffs.attackperceptionbonus += -1

      characterbuffs.challengebonus += -1
      characterbuffs.challengestrengthbonus += -1
      characterbuffs.challengeagilitybonus += -1
      characterbuffs.challengeintellectbonus += -1
      characterbuffs.challengewillbonus += -1
      characterbuffs.challengeperceptionbonus += -1
    }
    if (this.data.data.afflictions?.poisoned) {
      characterbuffs.attackbonus += -1
      characterbuffs.attackstrengthbonus += -1
      characterbuffs.attackagilitybonus += -1
      characterbuffs.attackintellectbonus += -1
      characterbuffs.attackwillbonus += -1
      characterbuffs.attackperceptionbonus += -1

      characterbuffs.challengebonus += -1
      characterbuffs.challengestrengthbonus += -1
      characterbuffs.challengeagilitybonus += -1
      characterbuffs.challengeintellectbonus += -1
      characterbuffs.challengewillbonus += -1
      characterbuffs.challengeperceptionbonus += -1
    }

    /*
    console.log('attackstrengthbonus = ' + characterbuffs.attackstrengthbonus)
    console.log('attackagilitybonus = ' + characterbuffs.attackagilitybonus)
    console.log('attackintellectbonus = ' + characterbuffs.attackintellectbonus)
    console.log('attackwillbonus = ' + characterbuffs.attackwillbonus)
    console.log(
      'attackperceptionbonus = ' + characterbuffs.attackperceptionbonus
    )
    console.log(
      'challengestrengthbonus = ' + characterbuffs.challengestrengthbonus
    )
    console.log(
      'challengeagilitybonus = ' + characterbuffs.challengeagilitybonus
    )
    console.log(
      'challengeintellectbonus = ' + characterbuffs.challengeintellectbonus
    )
    console.log('challengewillbonus = ' + characterbuffs.challengewillbonus)
    console.log(
      'challengeperceptionbonus = ' + characterbuffs.challengeperceptionbonus
    )
    */
    return characterbuffs
  }

  buildTalentEffects (talent, showTalentName, type) {
    let effects = ''

    if (showTalentName) {
      effects = talent.name + ':<br>'
    }

    if (
      talent.data.action?.boonsbanesactive &&
      talent.data?.action?.boonsbanes
    ) {
      if (talent.data.action?.strengthboonsbanesselect) {
        effects +=
          '&nbsp;&nbsp;&nbsp;• ' +
          game.i18n.localize('DL.TalentAttackBoonsBanes') +
          ' (' +
          game.i18n.localize('DL.AttributeStrength') +
          '): ' +
          talent.data.action?.boonsbanes +
          '<br>'
      }
      if (talent.data.action.agilityboonsbanesselect) {
        effects +=
          '&nbsp;&nbsp;&nbsp;• ' +
          game.i18n.localize('DL.TalentAttackBoonsBanes') +
          ' (' +
          game.i18n.localize('DL.AttributeAgility') +
          '): ' +
          talent.data.action?.boonsbanes +
          '<br>'
      }
      if (talent.data.action.intellectboonsbanesselect) {
        effects +=
          '&nbsp;&nbsp;&nbsp;• ' +
          game.i18n.localize('DL.TalentAttackBoonsBanes') +
          ' (' +
          game.i18n.localize('DL.AttributeIntellect') +
          '): ' +
          talent.data.action?.boonsbanes +
          '<br>'
      }
      if (talent.data.action.willboonsbanesselect) {
        effects +=
          '&nbsp;&nbsp;&nbsp;• ' +
          game.i18n.localize('DL.TalentAttackBoonsBanes') +
          ' (' +
          game.i18n.localize('DL.AttributeWill') +
          '): ' +
          talent.data.action?.boonsbanes +
          '<br>'
      }
      if (talent.data.action.perceptionboonsbanesselect) {
        effects +=
          '&nbsp;&nbsp;&nbsp;• ' +
          game.i18n.localize('DL.TalentAttackBoonsBanes') +
          ' (' +
          game.i18n.localize('DL.CharPerception') +
          '): ' +
          talent.data.action?.boonsbanes +
          '<br>'
      }
    }
    if (talent.data?.action.damageactive && talent.data?.action?.damage) {
      effects +=
        '&nbsp;&nbsp;&nbsp;• ' +
        game.i18n.localize('DL.TalentExtraDamage') +
        ': ' +
        talent.data.action?.damage +
        '<br>'
    }
    if (talent.data?.action.plus20active && talent.data?.action?.plus20) {
      effects +=
        '&nbsp;&nbsp;&nbsp;• ' +
        game.i18n.localize('DL.TalentExtraDamage20plus') +
        ': ' +
        talent.data.action?.plus20 +
        '<br>'
    }

    if (
      type === 'TALENT' &&
      talent.data?.challenge?.boonsbanesactive &&
      talent.data?.challenge?.boonsbanes
    ) {
      if (talent.data.challenge.strengthboonsbanesselect) {
        effects +=
          '&nbsp;&nbsp;&nbsp;• ' +
          game.i18n.localize('DL.TalentChallengeBoonsBanes') +
          ' (' +
          game.i18n.localize('DL.AttributeStrength') +
          '): ' +
          talent.data.challenge?.boonsbanes +
          '<br>'
      }
      if (talent.data.challenge.agilityboonsbanesselect) {
        effects +=
          '&nbsp;&nbsp;&nbsp;• ' +
          game.i18n.localize('DL.TalentChallengeBoonsBanes') +
          ' (' +
          game.i18n.localize('DL.AttributeAgility') +
          '): ' +
          talent.data.challenge?.boonsbanes +
          '<br>'
      }
      if (talent.data.challenge.intellectboonsbanesselect) {
        effects +=
          '&nbsp;&nbsp;&nbsp;• ' +
          game.i18n.localize('DL.TalentChallengeBoonsBanes') +
          ' (' +
          game.i18n.localize('DL.AttributeIntellect') +
          '): ' +
          talent.data.challenge?.boonsbanes +
          '<br>'
      }
      if (talent.data.challenge.willboonsbanesselect) {
        effects +=
          '&nbsp;&nbsp;&nbsp;• ' +
          game.i18n.localize('DL.TalentChallengeBoonsBanes') +
          ' (' +
          game.i18n.localize('DL.AttributeWill') +
          '): ' +
          talent.data.challenge?.boonsbanes +
          '<br>'
      }
      if (talent.data.challenge.perceptionboonsbanesselect) {
        effects +=
          '&nbsp;&nbsp;&nbsp;• ' +
          game.i18n.localize('DL.TalentChallengeBoonsBanes') +
          ' (' +
          game.i18n.localize('DL.CharPerception') +
          '): ' +
          talent.data.challenge?.boonsbanes +
          '<br>'
      }
    }
    if (
      type === 'TALENT' &&
      talent.data?.vs?.boonsbanesactive &&
      talent.data?.vs?.boonsbanes
    ) {
      effects +=
        '&nbsp;&nbsp;&nbsp;• ' +
        game.i18n.localize('DL.TalentVSBoonsBanes') +
        ': ' +
        talent.data.vs?.boonsbanes +
        '<br>'
    }
    if (
      type === 'TALENT' &&
      talent.data?.vs?.damageactive &&
      talent.data?.vs?.damage
    ) {
      effects +=
        '&nbsp;&nbsp;&nbsp;• ' +
        game.i18n.localize('DL.TalentVSDamage') +
        ': ' +
        talent.data.vs?.damage +
        '<br>'
    }
    if (
      type === 'TALENT' &&
      talent.data?.healing?.healactive &&
      talent.data?.healing?.rate
    ) {
      effects +=
        '&nbsp;&nbsp;&nbsp;• ' +
        game.i18n.localize('DL.TalentHealing') +
        ': ' +
        talent.data.healing?.rate +
        '<br>'
    }
    if (type === 'TALENT' && talent.data?.damage) {
      effects +=
        '&nbsp;&nbsp;&nbsp;• ' +
        game.i18n.localize('DL.TalentDamage') +
        ': ' +
        talent.data?.damage +
        '<br>'
    }
    if (!showTalentName && type === 'TALENT') {
      if (
        talent.data?.bonuses?.defenseactive &&
        talent.data?.bonuses?.defense
      ) {
        effects +=
          '&nbsp;&nbsp;&nbsp;• ' +
          game.i18n.localize('DL.TalentBonusesDefense') +
          ': ' +
          talent.data.bonuses?.defense +
          '<br>'
      }
      if (talent.data?.bonuses?.healthactive && talent.data?.bonuses?.health) {
        effects +=
          '&nbsp;&nbsp;&nbsp;• ' +
          game.i18n.localize('DL.TalentBonusesHealth') +
          ': ' +
          talent.data.bonuses?.health +
          '<br>'
      }
      if (talent.data?.bonuses?.speedactive && talent.data?.bonuses?.speed) {
        effects +=
          '&nbsp;&nbsp;&nbsp;• ' +
          game.i18n.localize('DL.TalentBonusesSpeed') +
          ': ' +
          talent.data.bonuses?.speed +
          '<br>'
      }
      if (talent.data?.bonuses?.poweractive && talent.data?.bonuses?.power) {
        effects +=
          '&nbsp;&nbsp;&nbsp;• ' +
          game.i18n.localize('DL.TalentBonusesPower') +
          ': ' +
          talent.data.bonuses?.power +
          '<br>'
      }
    }
    if (effects == talent.name + ':<br>') effects = ''

    return effects
  }

  buildArmorEffects (armorRequirementsNotMeet) {
    let effects

    if (armorRequirementsNotMeet) {
      effects =
        '&nbsp;&nbsp;&nbsp;• ' +
        game.i18n.localize('DL.TalentAttackBoonsBanes') +
        ': -1 <br>'
    }

    return effects
  }

  buildActionEffects (type) {
    let effects
    switch (type) {
      case 'ATTACK':
        if (this.data.data.afflictions?.prepare) {
          effects =
            game.i18n.localize('DL.prepare') +
            ':<br>' +
            '&nbsp;&nbsp;&nbsp;• ' +
            game.i18n.localize('DL.TalentAttackBoonsBanes') +
            ': 1 <br>'
        }
        break

      case 'CHALLENGE':
        if (this.data.data.afflictions?.prepare) {
          effects =
            game.i18n.localize('DL.prepare') +
            ':<br>' +
            '&nbsp;&nbsp;&nbsp;• ' +
            game.i18n.localize('DL.TalentChallengeBoonsBanes') +
            ': 1 <br>'
        }

        break
    }

    return effects
  }

  buildAfflictionsEffects (type) {
    let effects

    switch (type) {
      case 'ATTACK':
        if (this.data.data.afflictions?.diseased) {
          effects =
            game.i18n.localize('DL.diseased') +
            ':<br>' +
            '&nbsp;&nbsp;&nbsp;• ' +
            game.i18n.localize('DL.TalentAttackBoonsBanes') +
            ': -1 <br>'
        }
        if (this.data.data.afflictions?.fatigued) {
          effects =
            game.i18n.localize('DL.fatigued') +
            ':<br>' +
            '&nbsp;&nbsp;&nbsp;• ' +
            game.i18n.localize('DL.TalentAttackBoonsBanes') +
            ': -1 <br>'
        }
        if (this.data.data.afflictions?.impaired) {
          effects =
            game.i18n.localize('DL.impaired') +
            ':<br>' +
            '&nbsp;&nbsp;&nbsp;• ' +
            game.i18n.localize('DL.TalentAttackBoonsBanes') +
            ': -1 <br>'
        }
        if (this.data.data.afflictions?.poisoned) {
          effects =
            game.i18n.localize('DL.poisoned') +
            ':<br>' +
            '&nbsp;&nbsp;&nbsp;• ' +
            game.i18n.localize('DL.TalentAttackBoonsBanes') +
            ': -1 <br>'
        }

        break

      case 'CHALLENGE':
        if (this.data.data.afflictions?.diseased) {
          effects =
            game.i18n.localize('DL.diseased') +
            ':<br>' +
            '&nbsp;&nbsp;&nbsp;• ' +
            game.i18n.localize('DL.TalentChallengeBoonsBanes') +
            ': -1 <br>'
        }
        if (this.data.data.afflictions?.fatigued) {
          effects =
            game.i18n.localize('DL.fatigued') +
            ':<br>' +
            '&nbsp;&nbsp;&nbsp;• ' +
            game.i18n.localize('DL.TalentChallengeBoonsBanes') +
            ': -1 <br>'
        }
        if (this.data.data.afflictions?.impaired) {
          effects =
            game.i18n.localize('DL.impaired') +
            ':<br>' +
            '&nbsp;&nbsp;&nbsp;• ' +
            game.i18n.localize('DL.TalentChallengeBoonsBanes') +
            ': -1 <br>'
        }
        if (this.data.data.afflictions?.poisoned) {
          effects =
            game.i18n.localize('DL.poisoned') +
            ':<br>' +
            '&nbsp;&nbsp;&nbsp;• ' +
            game.i18n.localize('DL.TalentChallengeBoonsBanes') +
            ': -1 <br>'
        }

        break

      case 'SPELL':
        if (this.data.data.afflictions?.diseased) {
          effects =
            game.i18n.localize('DL.diseased') +
            ':<br>' +
            '&nbsp;&nbsp;&nbsp;• ' +
            game.i18n.localize('DL.TalentChallengeBoonsBanes') +
            ': -1 <br>'
        }
        if (this.data.data.afflictions?.fatigued) {
          effects =
            game.i18n.localize('DL.fatigued') +
            ':<br>' +
            '&nbsp;&nbsp;&nbsp;• ' +
            game.i18n.localize('DL.TalentChallengeBoonsBanes') +
            ': -1 <br>'
        }
        if (this.data.data.afflictions?.impaired) {
          effects =
            game.i18n.localize('DL.impaired') +
            ':<br>' +
            '&nbsp;&nbsp;&nbsp;• ' +
            game.i18n.localize('DL.TalentChallengeBoonsBanes') +
            ': -1 <br>'
        }
        if (this.data.data.afflictions?.poisoned) {
          effects =
            game.i18n.localize('DL.poisoned') +
            ':<br>' +
            '&nbsp;&nbsp;&nbsp;• ' +
            game.i18n.localize('DL.TalentChallengeBoonsBanes') +
            ': -1 <br>'
        }

        break

      default:
        break
    }

    return effects
  }

  async activateTalent (talent, setActive) {
    const uses = talent.data.uses?.value
    const usesmax = talent.data.uses?.max

    if (parseInt(uses) >= 0) {
      if (uses < usesmax) {
        talent.data.uses.value = Number(uses) + 1
        talent.data.addtonextroll = setActive
      } else {
        talent.data.uses.value = 0
        talent.data.addtonextroll = false

        if (this.data.data.activebonuses) {
          this.removeCharacterBonuses(talent)
        }
      }

      if (!this.data.data.activebonuses) {
        this.addCharacterBonuses(talent)
      }

      await this.updateEmbeddedEntity('OwnedItem', talent)
    }
  }

  async deactivateTalent (talent) {
    const item = this.getOwnedItem(talent._id)
    const that = this
    await item
      .update({
        'data.addtonextroll': false
      })
      .then((item) => {
        that.render()
      })
  }

  async addCharacterBonuses (talent) {
    const healthbonus =
      talent.data.bonuses?.defenseactive && talent.data.bonuses?.health > 0
        ? parseInt(talent.data.bonuses?.health)
        : 0
    const defensebonus =
      talent.data.bonuses?.healthactive && talent.data.bonuses?.defense > 0
        ? parseInt(talent.data.bonuses?.defense)
        : 0
    const speedbonus =
      talent.data.bonuses?.speedactive && talent.data.bonuses?.speed > 0
        ? parseInt(talent.data.bonuses?.speed)
        : 0
    const powerbonus =
      talent.data.bonuses?.poweractive && talent.data.bonuses?.power > 0
        ? parseInt(talent.data.bonuses?.power)
        : 0

    /*
                await this.update({
                    "data.characteristics.health.max": parseInt(this.data.data.characteristics.health.max) + healthbonus,
                    "data.characteristics.defense": parseInt(this.data.data.characteristics.defense) + defensebonus,
                    "data.characteristics.speed.value": parseInt(this.data.data.characteristics.speed.value) + speedbonus,
                    "data.activebonuses": true
                });
                */
  }

  async removeCharacterBonuses (talent) {
    const healthbonus =
      talent.data.bonuses?.defenseactive && talent.data.bonuses?.health > 0
        ? parseInt(talent.data.bonuses?.health)
        : 0
    const defensebonus =
      talent.data.bonuses?.healthactive && talent.data.bonuses?.defense > 0
        ? parseInt(talent.data.bonuses?.defense)
        : 0
    const speedbonus =
      talent.data.bonuses?.speedactive && talent.data.bonuses?.speed > 0
        ? parseInt(talent.data.bonuses?.speed)
        : 0
    const powerbonus =
      talent.data.bonuses?.poweractive && talent.data.bonuses?.power > 0
        ? parseInt(talent.data.bonuses?.power)
        : 0

    await this.update({
      'data.characteristics.health.max':
        parseInt(this.data.data.characteristics.health.max) - healthbonus,
      'data.characteristics.defense':
        parseInt(this.data.data.characteristics.defense) - defensebonus,
      'data.characteristics.speed.value':
        parseInt(this.data.data.characteristics.speed.value) - speedbonus,
      'data.characteristics.power.value':
        parseInt(this.data.data.characteristics.power.value) - powerbonus,
      'data.activebonuses': false
    })
  }

  async addDamageToTarget (damage) {
    game.user.targets.forEach(async (target) => {
      const targetActor = target.actor
      const currentDamage = parseInt(
        targetActor.data.data.characteristics.health.value
      )
      if (game.settings.get('demonlord', 'reverseDamage')) {
        if (currentDamage - damage <= 0) {
          await targetActor.update({
            'data.characteristics.health.value': 0
          })
        } else {
          await targetActor.update({
            'data.characteristics.health.value': currentDamage - damage
          })
        }
      } else {
        await targetActor.update({
          'data.characteristics.health.value': currentDamage + damage
        })
      }
    })
  }

  async updateCharacterMods (modItem) {
    const mod = duplicate(modItem)

    let roundsleft = parseInt(mod.data.roundsleft)
    if (roundsleft > 0) {
      roundsleft--
      mod.data.roundsleft = roundsleft
      if (roundsleft == 0) {
        mod.data.roundsleft = mod.data.rounds
        mod.data.active = false
      }
      await this.updateEmbeddedEntity('OwnedItem', mod)
    }
  }

  async restActor (token) {
    // Talents
    const talents = this.getEmbeddedCollection('OwnedItem').filter(
      (e) => e.type === 'talent'
    )
    for (const talent of talents) {
      const item = duplicate(this.getEmbeddedEntity('OwnedItem', talent._id))
      item.data.uses.value = 0

      await this.updateEmbeddedEntity('OwnedItem', item)
    }

    // Spells
    const spells = this.getEmbeddedCollection('OwnedItem').filter(
      (e) => e.type === 'spell'
    )

    for (const spell of spells) {
      const item = duplicate(this.getEmbeddedEntity('OwnedItem', spell._id))

      item.data.castings.value = 0

      await this.updateEmbeddedEntity('OwnedItem', item)
    }

    this.applyHealing(token, true)

    var templateData = {
      actor: this
    }

    const chatData = {
      user: game.user._id,
      speaker: {
        actor: this._id,
        token: this.token,
        alias: this.name
      }
    }

    const template = 'systems/demonlord/templates/chat/rest.html'
    renderTemplate(template, templateData).then((content) => {
      chatData.content = content
      ChatMessage.create(chatData)
    })
  }

  async applyHealing (token, fullHealingRate) {
    if (token.actor.data.type === 'character') {
      if (token.data.actorData.data?.characteristics != undefined) {
        const tokenData = duplicate(token.data)
        const hp = tokenData.actorData?.data?.characteristics?.health
        const rate =
          tokenData.actorData?.data?.characteristics?.health?.healingrate

        if (game.settings.get('demonlord', 'reverseDamage')) {
          let newdamage =
            parseInt(hp.value) +
            (fullHealingRate ? parseInt(rate) : parseInt(rate / 2))
          if (newdamage > hp.max) newdamage = parseInt(hp.max)

          hp.value = newdamage
        } else {
          let newdamage =
            parseInt(hp.value) -
            (fullHealingRate ? parseInt(rate) : parseInt(rate / 2))
          if (newdamage < 0) newdamage = 0

          hp.value = newdamage
        }

        await token.update(tokenData)
      } else {
        const actorData = duplicate(token.actor.data)
        const hp = actorData.data.characteristics.health
        const rate = actorData.data.characteristics.health.healingrate

        if (game.settings.get('demonlord', 'reverseDamage')) {
          let newdamage =
            parseInt(hp.value) +
            (fullHealingRate ? parseInt(rate) : parseInt(rate / 2))
          if (newdamage > hp.max) newdamage = parseInt(hp.max)

          hp.value = newdamage
        } else {
          let newdamage =
            parseInt(hp.value) -
            (fullHealingRate ? parseInt(rate) : parseInt(rate / 2))
          if (newdamage < 0) newdamage = 0

          hp.value = newdamage
        }

        await token.actor.update(actorData)
      }
    }
  }

  async setUsesOnSpells (data) {
    const power = data.data.characteristics.power

    for (let rank = 0; rank <= power; rank++) {
      const spells = this.getEmbeddedCollection('OwnedItem').filter(
        (e) => e.type === 'spell' && parseInt(e.data.rank) === rank
      )
      spells.forEach((spell) => {
        spell = duplicate(spell)
        const rank = spell.data.rank
        const usesMax = CONFIG.DL.spelluses[power].split(',')[rank]

        if (spell.data.castings.value === '') {
          spell.data.castings.value = '0'
        }
        spell.data.castings.max = usesMax

        this.updateEmbeddedEntity('OwnedItem', spell)
      })
    }
  }
}
