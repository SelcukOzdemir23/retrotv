import { map } from 'nanostores';

export type TVState = {
    power: boolean;
    channel: number;
    volume: number;
    isMuted: boolean;
};

export const tvStore = map<TVState>({
    power: false,
    channel: 1, // Start at channel 1
    volume: 50,
    isMuted: false,
});

export const togglePower = () => {
    const current = tvStore.get();
    tvStore.setKey('power', !current.power);
};

export const setChannel = (ch: number) => {
    // Clamp channel or loop? PRD says 0-4.
    // Let's just set it.
    tvStore.setKey('channel', ch);
};

export const changeChannel = (direction: 1 | -1) => {
    const current = tvStore.get();
    if (!current.power) return;

    let newCh = current.channel + direction;
    // Channels 0 to 8
    if (newCh > 8) newCh = 0;
    if (newCh < 0) newCh = 8;

    tvStore.setKey('channel', newCh);
};

export const adjustVolume = (change: number) => {
    const current = tvStore.get();
    if (!current.power) return;

    let newVol = current.volume + change;
    if (newVol > 100) newVol = 100;
    if (newVol < 0) newVol = 0;

    tvStore.setKey('volume', newVol);
    tvStore.setKey('isMuted', false); // Unmute on volume change
};
