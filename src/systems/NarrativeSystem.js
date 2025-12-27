
export class NarrativeSystem {
    constructor(environmentSystem) {
        this.environmentSystem = environmentSystem;
        this.pages = [
            { text: "Long ago, a party of heroes saved the world.", bg: "party_heroes" },
            { text: "The demon king fell. People celebrated.", bg: "party_victory" },
            { text: "Songs were sung very loudly.", bg: "party_songs" },
            { text: "Statues were carved in places no one visits anymore.", bg: "statue_abandoned" },
            { text: "Then time moved on. Like it always does.", bg: "time_pass" },
            { text: "You are Aeris, an elf mage.", bg: "travel_elf" },
            { text: "You age slowly... until everyone you know doesn’t.", bg: "time_age" },
            { text: "Centuries pass like badly written diary pages.", bg: "time_diary" },
            { text: "You also don’t travel alone anymore.", bg: "travel_companion" },
            { text: "At some point, you picked up a small companion.", bg: "travel_companion" },
            { text: "They’re cheerful. A little stupid. Kind of a cupcake of a person.", bg: "travel_cupcake" },
            { text: "The world is peaceful. Too peaceful.", bg: "time_peace" }
        ];

        this.currentPage = 0;
        this.storyTextElement = document.getElementById('story-text');
        this.storyBox = document.getElementById('story-box');
        this.clockElement = document.getElementById('game-clock');

        
        if (!this.clockElement) {
            this.createClock();
        }

        this.MURF_API_KEY = 'ap2_0eac8215-deb6-4b54-bfbe-edcffbc05053'; //please no no no steal my api key :3
        this.currentAudio = null;
        this.voiceId = null;
        this.textAnimationInterval = null;
    }

    createClock() {
        this.clockElement = document.createElement('div');
        this.clockElement.id = 'game-clock';
        this.clockElement.style.cssText = `
            position: absolute;
            top: 30px;
            right: 30px;
            font-size: 20px;
            font-weight: 600;
            color: white;
            background: rgba(0, 0, 0, 0.4);
            padding: 10px 20px;
            border-radius: 50px;
            backdrop-filter: blur(10px);
            border: 1px solid rgba(255, 255, 255, 0.1);
            letter-spacing: 1px;
            pointer-events: none;
        `;
        document.body.appendChild(this.clockElement);
    }

    animateText(text) {
        if (!this.storyTextElement) return;
        this.storyTextElement.innerHTML = '';
        const words = text.split(' ');
        let wordIndex = 0;

        if (this.textAnimationInterval) clearInterval(this.textAnimationInterval);

        this.textAnimationInterval = setInterval(() => {
            if (wordIndex < words.length) {
                this.storyTextElement.innerText += (wordIndex === 0 ? '' : ' ') + words[wordIndex];
                wordIndex++;
            } else {
                clearInterval(this.textAnimationInterval);
            }
        }, 100);
    }

    async getVoiceId() {
        if (this.voiceId) return this.voiceId;
        try {
            const response = await fetch('https://api.murf.ai/v1/speech/voices', {
                headers: { 'api-key': this.MURF_API_KEY }
            });
            const voices = await response.json();
            const preferred = voices.find(v => v.locale === 'en-US' && v.gender === 'FEMALE');
            this.voiceId = preferred ? preferred.voiceId : voices[0].voiceId;
            console.log('Selected Voice ID:', this.voiceId);
            return this.voiceId;
        } catch (e) {
            console.error('Failed to fetch voices:', e);
            return null;
        }
    }

    async playTTS(text) {
        if (this.currentAudio) {
            this.currentAudio.pause();
            this.currentAudio = null;
        }
        const cleanText = text.replace(/["']/g, "");
        try {
            const vId = await this.getVoiceId();
            if (!vId) return;

            const response = await fetch('https://api.murf.ai/v1/speech/generate', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'api-key': this.MURF_API_KEY
                },
                body: JSON.stringify({
                    voiceId: vId,
                    text: cleanText,
                    style: 'General',
                    channelType: 'MONO',
                    modelVersion: 'GEN2'
                })
            });

            const data = await response.json();
            if (data.audioFile) {
                this.currentAudio = new Audio(data.audioFile);
                this.currentAudio.play();
            }
        } catch (e) {
            console.error('TTS Error:', e);
        }
    }

    nextPage() {
        this.currentPage = (this.currentPage + 1) % this.pages.length;
        const text = this.pages[this.currentPage].text;
        this.animateText(text);
        this.playTTS(text);
        this.environmentSystem.generate();
    }

    update(uiOpacity) {
     
        if (this.storyBox) {
            this.storyBox.style.opacity = uiOpacity;
        } else if (this.storyTextElement) {
            this.storyTextElement.style.opacity = uiOpacity;
        }

        
        const dayDuration = 3600000;
        const cycle = (Date.now() % dayDuration) / dayDuration;
        const totalMinutes = cycle * 24 * 60;
        const hours = Math.floor(totalMinutes / 60);
        const minutes = Math.floor(totalMinutes % 60);
        const ampm = hours >= 12 ? 'PM' : 'AM';
        const displayHours = hours % 12 || 12;
        if (this.clockElement) {
            this.clockElement.innerText = `${displayHours}:${minutes.toString().padStart(2, '0')} ${ampm}`;
        }
    }
}
