/**
 * Extend the basic ItemSheet with some very simple modifications
 * @extends {ItemSheet}
 */
import { PathLevelItem, DamageType } from '../pathlevel.js'
import {
  onManageActiveEffect,
  prepareActiveEffectCategories
} from '../effects.js'

export class DemonlordItemSheetDefault extends ItemSheet {
  /** @override */
  static get defaultOptions () {
    return mergeObject(super.defaultOptions, {
      classes: ['demonlord2', 'sheet', 'item'],
      width: 520,
      height: 520,
      tabs: [
        {
          navSelector: '.sheet-tabs',
          contentSelector: '.sheet-body',
          initial: 'attributes'
        }
      ],
      scrollY: ['.tab.paths', '.tab.active']
    })
  }

  /** @override */
  get template () {
    const path = 'systems/demonlord/templates/item'
    return `${path}/item-${this.item.data.type}-sheet.html`
  }

  /* -------------------------------------------- */

  /** @override */
  getData () {
    const data = super.getData()
    data.isGM = game.user.isGM
    data.useDemonlordMode = game.settings.get('demonlord', 'useHomebrewMode')
    data.lockAncestry = game.settings.get('demonlord', 'lockAncestry')
    data.effects = prepareActiveEffectCategories(this.entity.effects)

    if (this.item.data.type == 'path') {
      this._prepareLevels(data)
    } else if (
      this.item.data.type == 'weapon' ||
      this.item.data.type == 'spell'
    ) {
      this._prepareDamageTypes(data)
    } else if (this.item.data.type == 'talent') this._prepareVSDamageTypes(data)
    else if (this.item.data.type == 'ancestry') {
      if (!game.user.isGM && !data.useDemonlordMode) {
        data.item.data.editAncestry = false
      }
    }

    return data
  }

  _prepareLevels (data) {
    const itemData = data.item

    const levels = []
    const talents = []
    const talents4 = []

    for (const level of itemData.data.levels) {
      levels.push(level)
    }

    for (const talent of itemData.data.talents) {
      talents.push(talent)
    }

    for (const talent of itemData.data.level4.talent) {
      talents4.push(talent)
    }

    itemData.levels = levels
    itemData.talents = talents
    itemData.talents4 = talents4
  }

  _prepareDamageTypes (data) {
    const itemData = data.item
    const damagetypes = []

    for (const damagetype of itemData.data?.action?.damagetypes) {
      damagetypes.push(damagetype)
    }

    itemData.damagetypes = damagetypes
  }

  _prepareVSDamageTypes (data) {
    const itemData = data.item
    const damagetypes = []
    const vsdamagetypes = []

    for (const damagetype of itemData.data?.action?.damagetypes) {
      damagetypes.push(damagetype)
    }

    for (const vsdamagetype of itemData.data?.vs?.damagetypes) {
      vsdamagetypes.push(vsdamagetype)
    }

    itemData.damagetypes = damagetypes
    itemData.vsdamagetypes = vsdamagetypes
  }

  /* -------------------------------------------- */

  /** @override */
  setPosition (options = {}) {
    const position = super.setPosition(options)
    const sheetBody = this.element.find('.sheet-body')
    const bodyHeight = position.height - 125
    sheetBody.css('height', bodyHeight)
    return position
  }

  /* -------------------------------------------- */

  /** @override */
  activateListeners (html) {
    super.activateListeners(html)
    // Everything below here is only needed if the sheet is editable
    if (!this.options.editable) return

    if (this.isEditable) {
      html
        .find('.effect-control')
        .click((ev) => onManageActiveEffect(ev, this.entity))

      const inputs = html.find('input')
      inputs.focus((ev) => ev.currentTarget.select())
    }

    html.find('.radiotrue').click((ev) => {
      this.updateOption(true)
    })

    html.find('.radiofalse').click((ev) => {
      this.updateOption(false)
    })

    html.find('.damagetype-control').click((ev) => {
      this.onManageDamageType(ev, this.item)
    })

    html.find('.vsdamagetype-control').click((ev) => {
      this.onManageVSDamageType(ev, this.item)
    })

    // Add drag events.
    html
      .find('.drop-area')
      .on('dragover', this._onDragOver.bind(this))
      .on('dragleave', this._onDragLeave.bind(this))
      .on('drop', this._onDrop.bind(this))

    html.find('.delete-ancestryitem').click((ev) => {
      const itemGroup = ev.currentTarget.parentElement.parentElement.parentElement.getAttribute(
        'data-group'
      )
      const itemIndex = ev.currentTarget.parentElement.getAttribute(
        'data-item-id'
      )

      this.deleteItem(itemIndex, itemGroup)
    })

    html.find('.transfer-talent').click((ev) => {
      this.showTransferDialog(
        game.i18n.localize('DL.PathsDialogTransferTalent'),
        game.i18n.localize('DL.PathsDialogTransferTalentText'),
        ev
      )
    })

    html.find('.transfer-talents').click((ev) => {
      this.showTransferDialog(
        game.i18n.localize('DL.PathsDialogTransferTalents'),
        game.i18n.localize('DL.PathsDialogTransferTalentsText'),
        ev
      )
    })

    html.find('.edit-ancestrytalents').click((ev) => {
      const that = this
      this.item
        .update({
          'data.editTalents': !this.item.data.data.editTalents
        })
        .then((item) => {
          that.render()
        })
    })
  }

  async _onDragOver (ev) {
    const $self = $(ev.originalEvent.target)
    const $dropTarget = $self
    $dropTarget.addClass('drop-hover')
    return false
  }

  async _onDragLeave (ev) {
    const $self = $(ev.originalEvent.target)
    const $dropTarget = $self
    $dropTarget.removeClass('drop-hover')
    return false
  }

  async _onDrop (ev) {
    const $self = $(ev.originalEvent.target)
    const $dropTarget = $self

    // Get data.
    let data
    try {
      data = JSON.parse(ev.originalEvent.dataTransfer.getData('text/plain'))
      if (data.type !== 'Item') return
    } catch (err) {
      return false
    }

    const group = $dropTarget.data('group')
    this._addItem(data, group)

    $dropTarget.removeClass('drop-hover')

    return false
  }

  async _addItem (data, group) {
    const itemId = data.id
    const levelItem = new PathLevelItem()
    const itemData = duplicate(this.item.data)
    let item
    let type

    if (data.pack) {
      const pack = game.packs.get(data.pack)
      if (pack.metadata.entity !== 'Item') return
      item = await pack.getEntity(data.id)
      type = item._data.type
    } else if (data.data) {
      item = data
      type = item.type
    } else {
      item = game.items.get(data.id)
      type = item.type
    }
    if (!item || !(type === item.data.type)) return

    switch (type) {
      case 'talent':
        levelItem.id = item._id
        levelItem.name = item.name
        levelItem.description = item.data.data.description
        levelItem.pack = data.pack ? data.pack : ''

        if (group === 'talent') itemData.data.talents.push(levelItem)
        else itemData.data.level4.talent.push(levelItem)

        break
      case 'language':
        levelItem.id = item._id
        levelItem.name = item.name
        levelItem.description = item.data.data.description
        levelItem.pack = data.pack ? data.pack : ''

        itemData.data.languagelist.push(levelItem)

        break
      default:
        break
    }

    await this.item.update(itemData, { diff: false })
    this.render(true)
  }

  async deleteItem (itemIndex, itemGroup) {
    const itemData = duplicate(this.item.data)

    switch (itemGroup) {
      case 'talent':
        itemData.data.talents.splice(itemIndex, 1)
        break
      case 'talent4':
        itemData.data.level4.talent.splice(itemIndex, 1)
        break
      case 'language':
        itemData.data.languagelist.splice(itemIndex, 1)
        break
      default:
        break
    }

    await this.item.update(itemData, { diff: false })
    this.render(true)
  }

  showTransferDialog (title, content, event) {
    const d = new Dialog({
      title: title,
      content: content,
      buttons: {
        yes: {
          icon: '<i class="fas fa-check"></i>',
          label: game.i18n.localize('DL.DialogYes'),
          callback: (html) => this.transferItem(event)
        },
        no: {
          icon: '<i class="fas fa-times"></i>',
          label: game.i18n.localize('DL.DialogNo'),
          callback: () => {}
        }
      },
      default: 'no',
      close: () => {}
    })
    d.render(true)
  }

  async transferItem (event) {
    event.preventDefault()

    if (event.currentTarget.className.indexOf('transfer-talents')) {
      const itemGroup = event.currentTarget.getAttribute('data-group')

      if (itemGroup === 'talent') {
        for (const talent of this.object.data.data.talents) {
          const item = game.items.get(talent.id)

          if (item != null) await this.actor.createOwnedItem(item)
        }
      } else if (itemGroup === 'talent4') {
        for (const talent of this.object.data.data.level4.talent) {
          const item = game.items.get(talent.id)

          if (item != null) await this.actor.createOwnedItem(item)
        }
      }
    } else {
      // Transfer single Item
      const itemIndex = event.currentTarget.getAttribute('data-item-id')
      const itemGroup = event.currentTarget.parentElement.parentElement.getAttribute(
        'data-group'
      )

      if (itemGroup === 'talent') {
        const selectedLevelItem = this.object.data.data.talents[itemIndex]
        const item = game.items.get(selectedLevelItem.id)

        if (item != null) await this.actor.createOwnedItem(item)
      } else if (itemGroup === 'talent4') {
        const selectedLevelItem = this.object.data.data.level4.talent[itemIndex]
        const item = game.items.get(selectedLevelItem.id)

        if (item != null) await this.actor.createOwnedItem(item)
      }
    }
  }

  /**
   * This method is called upon form submission after form data is validated
   * @param event {Event}       The initial triggering submission event
   * @param formData {Object}   The object of validated form data with which to update the object
   * @private
   */
  async _updateObject (event, formData) {
    const item = this.object
    const updateData = expandObject(formData)

    if (item.type === 'talent') {
      // If a Talent has no uses it's always active
      if (
        (updateData.data?.uses?.value == null &&
          updateData.data?.uses?.max == null) ||
        (updateData.data?.uses?.value === '0' &&
          updateData.data?.uses?.max === '0')
      ) {
        await this.object.update({
          'data.addtonextroll': true
        })

        const characterbuffs = this.generateCharacterBuffs()
        await this.actor?.update({
          'data.characteristics.defensebonus': parseInt(
            characterbuffs.defensebonus
          ),
          'data.characteristics.healthbonus': parseInt(
            characterbuffs.healthbonus
          ),
          'data.characteristics.speedbonus': parseInt(characterbuffs.speedbonus)
        })
      } else {
        await this.entity.update({
          'data.addtonextroll': false
        })
      }

      for (const [k, v] of Object.entries(formData)) {
        if (k === 'altdamagevs') {
          let index = 0

          if (Array.isArray(v)) {
            for (const id of v) {
              item.data.data.vs.damagetypes[index].damage = id
              index++
            }
          } else {
            item.data.data.vs.damagetypes[index].damage = v
          }
        } else if (k === 'altdamagetypevs') {
          let index = 0

          if (Array.isArray(v)) {
            for (const id of v) {
              item.data.data.vs.damagetypes[index].damagetype = id
              index++
            }
          } else {
            item.data.data.vs.damagetypes[index].damagetype = v
          }
        }
      }

      await this.object.update({
        'data.vs.damagetypes': duplicate(this.item.data.data?.vs?.damagetypes)
      })
    } else if (item.type === 'weapon' || item.type === 'spell') {
      for (const [k, v] of Object.entries(formData)) {
        if (k === 'altdamage') {
          let index = 0

          if (Array.isArray(v)) {
            for (const id of v) {
              item.data.data.action.damagetypes[index].damage = id
              index++
            }
          } else {
            item.data.data.action.damagetypes[index].damage = v
          }
        } else if (k === 'altdamagetype') {
          let index = 0

          if (Array.isArray(v)) {
            for (const id of v) {
              item.data.data.action.damagetypes[index].damagetype = id
              index++
            }
          } else {
            item.data.data.action.damagetypes[index].damagetype = v
          }
        }
      }
      await this.object.update({
        'data.action.damagetypes': duplicate(
          this.item.data.data.action.damagetypes
        )
      })
    } else if (item.type === 'ancestry' && this.actor) {
      // Update Spell uses when power changes
      if (updateData.data?.characteristics?.power) {
        var newPower = parseInt(updateData.data.characteristics.power)

        const paths = this.actor
          .getEmbeddedCollection('OwnedItem')
          .filter((e) => e.type === 'path')
        for (const path of paths) {
          for (const level of path.data.levels) {
            if (level.level <= this.actor.data.data.level) {
              newPower += parseInt(level.characteristicsPower)
            }
          }
        }

        this.actor.data.data.characteristics.power = newPower
        this.actor.setUsesOnSpells(this.actor.data)
      }
    }

    return this.entity.update(updateData)
  }

  generateCharacterBuffs () {
    const characterbuffs = new CharacterBuff()
    characterbuffs.challengestrengthbonus = 0
    characterbuffs.challengeagilitybonus = 0
    characterbuffs.challengeintellectbonus = 0
    characterbuffs.challengewillbonus = 0
    characterbuffs.challengeperceptionbonus = 0

    const talents = this.actor
      ?.getEmbeddedCollection('OwnedItem')
      .filter((e) => e.type === 'talent')

    if (talents) {
      for (const talent of talents) {
        if (talent.data.addtonextroll) {
          if (
            this.actor.data.data.activebonuses ||
            (talent.data.uses.value > 0 && talent.data.uses.max > 0)
          ) {
            if (
              talent.data.bonuses.defenseactive &&
              talent.data.bonuses.defense > 0
            ) {
              characterbuffs.defensebonus += parseInt(
                talent.data.bonuses.defense
              )
            }
            if (
              talent.data.bonuses.healthactive &&
              talent.data.bonuses.health > 0
            ) {
              characterbuffs.healthbonus += parseInt(talent.data.bonuses.health)
            }
            if (
              talent.data.bonuses.speedactive &&
              talent.data.bonuses.speed > 0
            ) {
              characterbuffs.speedbonus += parseInt(talent.data.bonuses.speed)
            }
            if (
              talent.data.bonuses.poweractive &&
              talent.data.bonuses.power > 0
            ) {
              characterbuffs.powerbonus += parseInt(talent.data.bonuses.power)
            }
          }
        }
      }
    }
    return characterbuffs
  }

  async updateOption (selected) {
    await this.object.update({
      'data.level4.option1': selected
    })
  }

  async onManageDamageType (event, item) {
    event.preventDefault()
    const a = event.currentTarget
    const itemData = duplicate(item)

    switch (a.dataset.action) {
      case 'create':
        itemData.data.action.damagetypes.push(new DamageType())

        await this.item.update(itemData, { diff: false })
        this.render(true)
        break
      case 'delete':
        itemData.data.action.damagetypes.splice(a.dataset.id, 1)

        await this.item.update(itemData, { diff: false })
        this.render(true)
        break
    }
  }

  async onManageVSDamageType (event, item) {
    event.preventDefault()
    const a = event.currentTarget
    const itemData = duplicate(item)

    switch (a.dataset.action) {
      case 'create':
        itemData.data.vs.damagetypes.push(new DamageType())

        await this.item.update(itemData, { diff: false })
        this.render(true)
        break
      case 'delete':
        itemData.data.vs.damagetypes.splice(a.dataset.id, 1)

        await this.item.update(itemData, { diff: false })
        this.render(true)
        break
    }
  }
}
