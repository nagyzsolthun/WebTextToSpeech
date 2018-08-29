export default function (voice1: chrome.tts.TtsVoice, voice2: chrome.tts.TtsVoice) {
    var result = compareExtensionId(voice1.extensionsId, voice2.extensionsId);
    result = result ? result : compareProvider(voice1.voiceName, voice2.voiceName);
    result = result ? result : compareLangs(voice1.lang, voice2.lang);
    result = result ? result : compareGender(voice1.gender, voice2.gender);
    result = result ? result : compareVoiceName(voice1.voiceName, voice2.voiceName);
    return result;
}

const langs = ["en-US", "en-GB", "en", "de", "fr", "es-ES", "es-US"]
function calcLanValue(voiceLan: string) {
    const index = langs.findIndex(lang => voiceLan.startsWith(lang));
    if (index > -1) return langs.length - index;
    else return 0;
}

function compareLangs(lang1: string, lang2: string) {
    const langIndex1 = langs.findIndex(lang => lang1.startsWith(lang));
    const langIndex2 = langs.findIndex(lang => lang2.startsWith(lang));

    if (langIndex1 == langIndex2) return 0;

    // one of the languages missing
    if (langIndex2 == -1) return 1;
    if (langIndex1 == -1) return -1;

    // both in langs
    if (langIndex1 < langIndex2) return 1;
    if (langIndex1 > langIndex2) return -1;
}

function compareExtensionId(id1: string, id2: string) {
    if (id1 == null && id2 != null) return 1;   // null extensionId wins
    if (id1 != null && id2 == null) return -1;
    return 0;
}

function compareProvider(voiceName1: string, voiceName2: string) {
    const value1 = voiceName1.startsWith("IBM") ? 0 : 10;
    const value2 = voiceName2.startsWith("IBM") ? 0 : 10;

    if (value1 > value2) return 1;
    if (value1 < value2) return -1;
    return 0;
}

function compareGender(gender1: string, gender2: string) {
    if (gender1 == gender2) return 0;
    if (gender1 == "female") return 1;
    if (gender2 == "female") return -1;
}

function compareVoiceName(voiceName1: string, voiceName2: string) {
    if (voiceName1 == voiceName2) return 0;
    if (voiceName1 < voiceName2) return 1;   // alphabetically lower voice wins (A wins over B)
    if (voiceName1 > voiceName2) return -1;
}