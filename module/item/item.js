/**
 * Extend the basic Item with some very simple modifications.
 * @extends {Item}
 */
export class DemonlordItem extends Item {
    /**
     * Augment the basic Item data model with additional dynamic data.
     */
    prepareData() {
        super.prepareData();

        // Get the Item's data
        const itemData = this.data;
        const actorData = this.actor ? this.actor.data : {};
        const data = itemData.data;

        if (itemData.type == "armor" && itemData.data.strengthmin && (parseInt(itemData.data.strengthmin) > parseInt(actorData.data?.attributes?.strength?.value))) {
            itemData.data.wear = false;
        }
    }

    /**
     * Handle clickable rolls.
     * @param {Event} event   The originating click event
     * @private
     */
    async roll() {
    }

    static chatListeners(html) {
        html.on('click', '.roll-healing', this._onChatApplyHealing.bind(this));
        html.on('click', '.roll-damage', this._onChatRollDamage.bind(this));
        html.on('click', '.apply-damage', this._onChatApplyDamage.bind(this));
        html.on('click', '.use-talent', this._onChatUseTalent.bind(this));
        html.on('click', '.request-challengeroll', this._onChatRequestChallengeRoll.bind(this));
        html.on('click', '.make-challengeroll', this._onChatMakeChallengeRoll.bind(this));
        html.on('click', '.request-initroll', this._onChatRequestInitRoll.bind(this));
        html.on('click', '.make-initroll', this._onChatMakeInitRoll.bind(this));
    }

    static async _onChatApplyHealing(event) {
        event.preventDefault();
        const li = event.currentTarget;
        const item = li.children[0];
        const healing = parseInt(item.dataset.healing);

        var selected = canvas.tokens.controlled;
        if (selected.length == 0)
            ui.notifications.info(game.i18n.localize('DL.DialogWarningActorsNotSelected'));

        selected.forEach(token => {
            if (token.data.actorData.data?.characteristics != undefined) {
                let tokenData = duplicate(token.data);
                let hp = tokenData.actorData.data.characteristics.health;

                let newdamage = parseInt(hp.value) - healing;
                if (newdamage < 0)
                    newdamage = 0;

                hp.value = newdamage;
                token.update(tokenData);
            } else {
                let actorData = duplicate(token.actor.data);
                let hp = actorData.data.characteristics.health;

                let newdamage = parseInt(hp.value) - healing;
                if (newdamage < 0)
                    newdamage = 0;

                hp.value = newdamage;
                token.actor.update(actorData);
            }
        });
    }

    static async _onChatRollDamage(event) {
        event.preventDefault();
        const li = event.currentTarget;
        const token = li.closest(".demonlord");
        const actor = this._getChatCardActor(token);
        const item = li.children[0];
        const damageformular = item.dataset.damage;

        let damageRoll = new Roll(damageformular, {});
        damageRoll.roll();

        var templateData = {
            actor: this.actor,
            data: {
                damageTotal: {
                    value: damageRoll._total
                },
                damageDouble: {
                    value: parseInt(damageRoll._total) * 2
                },
                damageHalf: {
                    value: Math.floor(parseInt(damageRoll._total) / 2)
                }
            }
        };

        let chatData = {
            user: game.user._id,
            speaker: {
                actor: actor._id,
                token: actor.token,
                alias: actor.name
            }
        };

        let template = 'systems/demonlord/templates/chat/damage.html';
        renderTemplate(template, templateData).then(content => {
            chatData.content = content;
            if (game.dice3d) {
                game.dice3d.showForRoll(damageRoll, game.user, true, chatData.whisper, chatData.blind).then(displayed => ChatMessage.create(chatData));
            } else {
                chatData.sound = CONFIG.sounds.dice;
                ChatMessage.create(chatData);
            }
        });
    }

    static async _onChatApplyDamage(event) {
        event.preventDefault();
        const li = event.currentTarget;
        const item = li.children[0];
        const damage = parseInt(item.dataset.damage);

        var selected = canvas.tokens.controlled;
        if (selected.length == 0)
            ui.notifications.info(game.i18n.localize('DL.DialogWarningActorsNotSelected'));

        selected.forEach(token => {
            if (token.data.actorData.data?.characteristics != undefined) {
                let tokenData = duplicate(token.data);
                let hp = tokenData.actorData.data.characteristics.health;
                const health = parseInt(token.actor.data.data.characteristics.health.max);

                let newdamage = parseInt(hp.value) + damage;
                if (newdamage > health)
                    newdamage = health;

                hp.value = newdamage;
                token.update(tokenData);
            } else {
                let actorData = duplicate(token.actor.data);
                let hp = actorData.data.characteristics.health;
                const health = parseInt(actorData.data.characteristics.health.max);

                let newdamage = parseInt(hp.value) + damage;
                if (newdamage > health)
                    newdamage = health;

                hp.value = newdamage;
                token.actor.update(actorData);
            }
        });
    }

    static async _onChatUseTalent(event) {
        const token = event.currentTarget.closest(".demonlord");
        const actor = this._getChatCardActor(token);
        if (!actor) return;

        const li = event.currentTarget;
        const div = li.children[0];
        const talentId = div.dataset.itemId;

        //const item = actor.getOwnedItem(talentId);
        /*
        const token = this.actor.token;
        const item = this.data;
        const actorData = this.actor ? this.actor.data.data : {};
        const itemData = item.data;

        console.log(this.actor);
        console.log(itemData);
*/
        /*
        event.preventDefault();
        const li = event.currentTarget;
        const token = event.currentTarget.closest(".demonlord");
        const actor = game.actors.get(token.dataset.actorId);
        const div = li.children[0];
        const talentId = div.dataset.itemId;
        const talent = actor.getEmbeddedEntity("OwnedItem", talentId);

        console.log(this.data);
        */
    }

    static async _onChatRequestChallengeRoll(event) {
        event.preventDefault();
        const li = event.currentTarget;
        const item = li.children[0];
        const attribute = item.dataset.attribute;
        const start = li.closest(".demonlord");
        const boonsbanes = start.children[1].children[0].children[1].value;

        var selected = canvas.tokens.controlled;
        if (selected.length == 0)
            ui.notifications.info(game.i18n.localize('DL.DialogWarningActorsNotSelected'));

        let boonsbanestext = "";
        if (boonsbanes == 1)
            boonsbanestext = boonsbanes + " " + game.i18n.localize('DL.DialogBoon');
        if (boonsbanes > 1)
            boonsbanestext = boonsbanes + " " + game.i18n.localize('DL.DialogBoons');
        if (boonsbanes == -1)
            boonsbanestext = boonsbanes.replace("-", "") + " " + game.i18n.localize('DL.DialogBane');
        if (boonsbanes < -1)
            boonsbanestext = boonsbanes.replace("-", "") + " " + game.i18n.localize('DL.DialogBanes');

        selected.forEach(token => {
            const actor = token.actor;

            var templateData = {
                actor: this.actor,
                data: {
                    attribute: {
                        value: attribute
                    },
                    boonsbanes: {
                        value: boonsbanes
                    },
                    boonsbanestext: {
                        value: boonsbanestext
                    }
                }
            };

            let chatData = {
                user: game.user._id,
                speaker: {
                    actor: actor._id,
                    token: actor.token,
                    alias: actor.name
                }
            };

            chatData["whisper"] = ChatMessage.getWhisperRecipients(actor.name);

            let template = 'systems/demonlord/templates/chat/makechallengeroll.html';
            renderTemplate(template, templateData).then(content => {
                chatData.content = content;
                ChatMessage.create(chatData);
            });
        });
    }

    static async _onChatMakeChallengeRoll(event) {
        event.preventDefault();
        const li = event.currentTarget;
        const item = li.children[0];
        const attributeName = item.dataset.attribute;
        const boonsbanes = item.dataset.boonsbanes;
        const selected = canvas.tokens.controlled;

        selected.forEach(token => {
            const actor = token.actor;
            const attribute = actor.data.data.attributes[attributeName.toLowerCase()];

            actor.rollAttribute(attribute, boonsbanes);
        });
    }

    static async _onChatRequestInitRoll(event) {
        event.preventDefault();
        const li = event.currentTarget;
        const item = li.children[0];
        const attribute = item.dataset.attribute;
        const start = li.closest(".demonlord");

        var selected = canvas.tokens.controlled;
        if (selected.length == 0)
            ui.notifications.info(game.i18n.localize('DL.DialogWarningActorsNotSelected'));

        selected.forEach(token => {
            const actor = token.actor;

            var templateData = {
                actor: this.actor,
                data: {}
            };

            let chatData = {
                user: game.user._id,
                speaker: {
                    actor: actor._id,
                    token: actor.token,
                    alias: actor.name
                }
            };

            chatData["whisper"] = ChatMessage.getWhisperRecipients(actor.name);

            let template = 'systems/demonlord/templates/chat/makeinitroll.html';
            renderTemplate(template, templateData).then(content => {
                chatData.content = content;
                ChatMessage.create(chatData);
            });
        });
    }

    static async _onChatMakeInitRoll(event) {
        event.preventDefault();
        let combatantFound = null;

        var selected = canvas.tokens.controlled;
        selected.forEach(token => {
            for (const combatant of game.combat.combatants) {
                if (combatant.actor == token.actor) {
                    combatantFound = combatant;
                }
            }
        });

        if (combatantFound) {
            game.combat.rollInitiative(combatantFound._id);
        }
    }

    /**
   * Get the Actor which is the author of a chat card
   * @param {HTMLElement} card    The chat card being used
   * @return {Actor|null}         The Actor entity or null
   * @private
   */
    static _getChatCardActor(card) {
        // Case 1 - a synthetic actor from a Token
        const tokenKey = card.dataset.tokenId;
        if (tokenKey) {
            const [sceneId, tokenId] = tokenKey.split(".");
            const scene = game.scenes.get(sceneId);
            if (!scene) return null;
            const tokenData = scene.getEmbeddedEntity("Token", tokenId);
            if (!tokenData) return null;
            const token = new Token(tokenData);
            return token.actor;
        }

        // Case 2 - use Actor ID directory
        const actorId = card.dataset.actorId;
        return game.actors.get(actorId) || null;
    }

    /**
   * Get the Actor which is the target of a chat card
   * @param {HTMLElement} card    The chat card being used
   * @return {Array.<Actor>}      An Array of Actor entities, if any
   * @private
   */
    static _getChatCardTargets(card) {
        const character = game.user.character;
        const controlled = canvas.tokens.controlled;
        const targets = controlled.reduce((arr, t) => t.actor ? arr.concat([t.actor]) : arr, []);
        if (character && (controlled.length === 0)) targets.push(character);
        return targets;
    }
}
