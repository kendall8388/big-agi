//purposeselector.tsx
import * as React from 'react';
import { shallow } from 'zustand/shallow';

import { Box, Button, Checkbox, Grid, IconButton, Input, Stack, Textarea, Typography, useTheme } from '@mui/joy';
import ClearIcon from '@mui/icons-material/Clear';
import SearchIcon from '@mui/icons-material/Search';

import { SystemPurposeId, SystemPurposes } from '../../../data';
import { useChatStore } from '@/common/state/store-chats';
import { usePurposeStore } from '@/common/state/store-purposes';
import { useSettingsStore } from '@/common/state/store-settings';

import { Composer } from './composer/Composer';

//import CharacterBuilder from './CharacterBuilder';

// Constants for tile sizes / grid width - breakpoints need to be computed here to work around
// the "flex box cannot shrink over wrapped content" issue
//
// Absolutely dislike this workaround, but it's the only way I found to make it work


const alignments = ["Lawful Good", "Neutral Good", "Chaotic Good", "Lawful Neutral", "True Neutral", "Chaotic Neutral", "Lawful Evil", "Neutral Evil", "Chaotic Evil"];
const races = ["Human", "Elf", "Dwarf", "Halfling", "Dragonborn", "Gnome", "Half-Elf", "Half-Orc", "Tiefling"];
const genders = ["Non-Binary","Male", "Female"];
const classes = ["Fighter", "Wizard", "Rogue", "Paladin", "Cleric", "Ranger", "Barbarian", "Druid", "Monk", "Sorcerer", "Warlock", "Bard"];

type CharacterClass = 'Barbarian' | 'Bard' | 'Cleric' | 'Druid' | 'Fighter' | 'Monk' | 'Paladin' | 'Ranger' | 'Rogue' | 'Sorcerer' | 'Warlock' | 'Wizard';
const levelExperience: Record<number, number> = {
  1: 0,
  2: 300,
  3: 900,
  4: 2700,
  5: 6500,
  6: 14000,
  7: 23000,
  8: 34000,
  9: 48000,
  10: 64000,
  11: 85000,
  12: 100000,
  13: 120000,
  14: 140000,
  15: 165000,
  16: 195000,
  17: 225000,
  18: 265000,
  19: 305000,
  20: 355000,
};



const bpTileSize = { xs: 116, md: 125, xl: 130 };
const tileCols = [3, 4, 6];
const tileSpacing = 1;
const bpMaxWidth = Object.entries(bpTileSize).reduce((acc, [key, value], index) => {
  acc[key] = tileCols[index] * (value + 8 * tileSpacing) - 8 * tileSpacing;
  return acc;
}, {} as Record<string, number>);
const bpTileGap = { xs: 2, md: 3 };


// Add this utility function to get a random array element
const getRandomElement = <T extends any>(array: T[]): T | undefined =>
  array.length > 0 ? array[Math.floor(Math.random() * array.length)] : undefined;


/**
 * Purpose selector for the current chat. Clicking on any item activates it for the current chat.
 */
export function PurposeSelector(props: { conversationId: string, runExample: (example: string) => void }) {
  // state
  const [searchQuery, setSearchQuery] = React.useState('');
  const [filteredIDs, setFilteredIDs] = React.useState<SystemPurposeId[] | null>(null);
  const [editMode, setEditMode] = React.useState(false);
  const [alignment, setAlignment] = React.useState('True Neutral');
  const [race, setRace] = React.useState('Human');
  //const [raceTraits, setRaceTraits] = React.useState({});
  const [gender, setGender] = React.useState("Non-Binary");
  const [charClass, setCharClass] = React.useState<CharacterClass>('Fighter');
  const [str, setStr] = React.useState(10);
  const [dex, setDex] = React.useState(10);
  const [con, setCon] = React.useState(10);
  const [int, setInt] = React.useState(10);
  const [wis, setWis] = React.useState(10);
  const [cha, setCha] = React.useState(10);
  const [rolls, setRolls] = React.useState(0);
  const [level, setLevel] = React.useState(1);
  const [experience, setExperience] = React.useState(levelExperience[level]);
  const [characterName, setCharacterName] = React.useState("");
  const [rollButtonPressed, setRollButtonPressed] = React.useState(false);
 // const [characterSheet, setCharacterSheet] = React.useState(null);
  const [characterSheet, setCharacterSheet] = React.useState<CharacterSheet>(null);




  // external state
  const theme = useTheme();
  const showPurposeFinder = useSettingsStore(state => state.showPurposeFinder);
  const { systemPurposeId, setSystemPurposeId } = useChatStore(state => {
    const conversation = state.conversations.find(conversation => conversation.id === props.conversationId);
    return {
      systemPurposeId: conversation ? conversation.systemPurposeId : null,
      setSystemPurposeId: conversation ? state.setSystemPurposeId : null,
    };
  }, shallow);
  const { hiddenPurposeIDs, toggleHiddenPurposeId } = usePurposeStore(state => ({ hiddenPurposeIDs: state.hiddenPurposeIDs, toggleHiddenPurposeId: state.toggleHiddenPurposeId }), shallow);

  // safety check - shouldn't happen
  if (!systemPurposeId || !setSystemPurposeId)
    return null;


  const handleSearchClear = () => {
    setSearchQuery('');
    setFilteredIDs(null);
  };


  const handleAlignmentChange = (event: { target: { value: React.SetStateAction<string>; }; }) => setAlignment(event.target.value);
  const handleRaceChange = (event: { target: { value: React.SetStateAction<string>; }; }) => setRace(event.target.value);
  const handleGenderChange = (event: { target: { value: React.SetStateAction<string>; }; }) => setGender(event.target.value);
  const handleClassChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    setCharClass(event.target.value as CharacterClass);
  };
  

  React.useEffect(() => {
    setHitDie(getHitDieForClass(charClass));
    }, [charClass]);

  React.useEffect(() => {
    setHitPoints(calculateHitPoints(charClass, con));
    }, [charClass, con]);

  React.useEffect(() => {
    setExperience(levelExperience[level]);
    }, [level]);
    

    const handleLevelChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
      setLevel(Number(event.target.value));
    };
    

  const handleSearchOnChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value;
    if (!query)
      return handleSearchClear();
    setSearchQuery(query);

    // Filter results based on search term
    const ids = Object.keys(SystemPurposes)
      .filter(key => SystemPurposes.hasOwnProperty(key))
      .filter(key => {
        const purpose = SystemPurposes[key as SystemPurposeId];
        return purpose.title.toLowerCase().includes(query.toLowerCase())
          || (typeof purpose.description === 'string' && purpose.description.toLowerCase().includes(query.toLowerCase()));
      });
    setFilteredIDs(ids as SystemPurposeId[]);

    // If there's a search term, activate the first item
    if (ids.length && !ids.includes(systemPurposeId))
      handlePurposeChanged(ids[0] as SystemPurposeId);
  };

  const handleSearchOnKeyDown = (e: React.KeyboardEvent<HTMLInputElement>): void => {
    if (e.key == 'Escape')
      handleSearchClear();
  };


  const toggleEditMode = () => setEditMode(!editMode);


  const handlePurposeChanged = (purposeId: SystemPurposeId | null) => {
    if (purposeId)
      setSystemPurposeId(props.conversationId, purposeId);
  };

  const handleCustomSystemMessageChange = (v: React.ChangeEvent<HTMLTextAreaElement>): void => {
    // TODO: persist this change? Right now it's reset every time.
    //       maybe we shall have a "save" button just save on a state to persist between sessions
   // SystemPurposes['Custom'].systemMessage = v.target.value;
  };


  // we show them all if the filter is clear (null)
  const unfilteredPurposeIDs = (filteredIDs && showPurposeFinder) ? filteredIDs : Object.keys(SystemPurposes);
  const purposeIDs = editMode ? unfilteredPurposeIDs : unfilteredPurposeIDs.filter(id => !hiddenPurposeIDs.includes(id));

  const selectedPurpose = purposeIDs.length ? (SystemPurposes[systemPurposeId] ?? null) : null;
  //const selectedExample = selectedPurpose?.examples && getRandomElement(selectedPurpose.examples) || null;

  
  // The rollStat function
const rollStat = () => {
  const rolls = Array.from({ length: 4 }, () => Math.ceil(Math.random() * 6));
  rolls.sort((a, b) => b - a);
  rolls.pop();
  return rolls.reduce((a, b) => a + b, 0);
};

// Handler for the button click
const handleButtonClick = () => {
  if (rolls < 3) {
    setStr(rollStat());
    setDex(rollStat());
    setCon(rollStat());
    setInt(rollStat());
    setWis(rollStat());
    setCha(rollStat());
    setRolls(rolls + 1);
  }
  setRollButtonPressed(true);
};


const getConstitutionModifier = (con: number) => {
  if (con >= 2 && con <= 3) return -4;
  if (con >= 4 && con <= 5) return -3;
  if (con >= 6 && con <= 7) return -2;
  if (con >= 8 && con <= 9) return -1;
  if (con >= 10 && con <= 11) return 0;
  if (con >= 12 && con <= 13) return 1;
  if (con >= 14 && con <= 15) return 2;
  if (con >= 16 && con <= 17) return 3;
  if (con >= 18 && con <= 19) return 4;
  if (con === 20) return 5;
  return 0;
};

const getHitDieForClass = (cls: string) => {
  switch (cls) {
    case "Barbarian":
      return 12;
    case "Bard":
    case "Cleric":
    case "Druid":
    case "Monk":
    case "Rogue":
    case "Warlock":
      return 8;
    case "Fighter":
    case "Paladin":
    case "Ranger":
      return 10;
    case "Sorcerer":
    case "Wizard":
      return 6;
    default:
      return 0;
  }
};

const calculateHitPoints = (charClass: CharacterClass, con: number) => {
  const hitDieMap: Record<CharacterClass, number> = {
    Barbarian: 12,
    Bard: 8,
    Cleric: 8,
    Druid: 8,
    Fighter: 10,
    Monk: 8,
    Paladin: 10,
    Ranger: 10,
    Rogue: 8,
    Sorcerer: 6,
    Warlock: 8,
    Wizard: 6,
  };
  const hitDie = hitDieMap[charClass];
  const constitutionModifier = getConstitutionModifier(con);

  return hitDie + constitutionModifier;
};
const initialClass = "Fighter";
const [hitPoints, setHitPoints] = React.useState(calculateHitPoints(initialClass, con));
const [hitDie, setHitDie] = React.useState(getHitDieForClass(initialClass));

const genderFilteredClasses = (gender: string) => {
  switch(gender) {
    case "Male":
      return classes.filter(c => c !== "Sorcerer");
    case "Female":
      return classes.filter(c => c !== "Wizard");
    default:
      return classes;
  }
};

type CharacterSheet = {
  name: string;
  level: number;
  experience: number;
  alignment: string;
  race: string;
  gender: string;
  class: CharacterClass;
  str: number;
  dex: number;
  con: number;
  int: number;
  wis: number;
  cha: number;
  hitPoints: number;
  hitDie: number;
} | null;

const createCharacterSheet = () => {
  if (characterName === "" || !rollButtonPressed) return;

  const newCharacterSheet = {
    name: characterName,
    level: level,
    experience: experience,
    alignment: alignment,
    race: race,
    gender: gender,
    class: charClass,
    str: str,
    dex: dex,
    con: con,
    int: int,
    wis: wis,
    cha: cha,
    hitPoints: hitPoints,
    hitDie: hitDie,
  };

  setCharacterSheet(newCharacterSheet);

  console.log(newCharacterSheet);
};



  return <>

    {showPurposeFinder && <Box sx={{ p: 2 * tileSpacing }}>
      <Input
        fullWidth
        variant='outlined' color='neutral'
        value={searchQuery} onChange={handleSearchOnChange}
        onKeyDown={handleSearchOnKeyDown}
        placeholder='Search for purpose…'
        startDecorator={<SearchIcon />}
        endDecorator={searchQuery && (
          <IconButton variant='plain' color='neutral' onClick={handleSearchClear}>
            <ClearIcon />
          </IconButton>
        )}
        sx={{
          boxShadow: theme.vars.shadow.sm,
        }}
      />
    </Box>}

    <Stack direction='column' sx={{ minHeight: '60vh', justifyContent: 'center', alignItems: 'center' }}>

      <Box sx={{ maxWidth: bpMaxWidth }}>

        <Box sx={{ display: 'flex', flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between', gap: 2, mb: 1 }}>
          <Typography level='body2' color='neutral'>
            Select a Dungeon Difficulty
          </Typography>
          <Button variant='plain' color='neutral' size='sm' onClick={toggleEditMode}>
            {editMode ? 'Done' : 'Edit'}
          </Button>
        </Box>

        <Grid container spacing={tileSpacing} sx={{ justifyContent: 'flex-start', gap: 2, mb: 1 }}>
          {purposeIDs.map((spId) => (
            <Grid key={spId}>
              <Button
                variant={(!editMode && systemPurposeId === spId) ? 'solid' : 'soft'}
                color={(!editMode && systemPurposeId === spId) ? 'primary' : SystemPurposes[spId as SystemPurposeId]?.highlighted ? 'warning' : 'neutral'}
                onClick={() => !editMode && handlePurposeChanged(spId as SystemPurposeId)}
                sx={{
                  flexDirection: 'column',
                  fontWeight: 500,
                  gap: bpTileGap,
                  height: bpTileSize,
                  width: bpTileSize,
                  ...((editMode || systemPurposeId !== spId) ? {
                    boxShadow: theme.vars.shadow.md,
                    ...(SystemPurposes[spId as SystemPurposeId]?.highlighted ? {} : { background: theme.vars.palette.background.level1 }),
                  } : {}),
                }}
              >
                {editMode && (
                  <Checkbox
                    label={<Typography level='body2'>show</Typography>}
                    checked={!hiddenPurposeIDs.includes(spId)} onChange={() => toggleHiddenPurposeId(spId)}
                    sx={{ alignSelf: 'flex-start' }}
                  />
                )}
                <div style={{ fontSize: '2rem' }}>
                  {SystemPurposes[spId as SystemPurposeId]?.symbol}
                </div>
                <div>
                  {SystemPurposes[spId as SystemPurposeId]?.title}
                </div>
              </Button>
            </Grid>
          ))}
        </Grid>
   
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 2, mb: 1 }}>
    <Typography level='body2' color='neutral' sx={{ textAlign: 'center' }}>
        Build Your Character
    </Typography>
</Box>

<Box sx={{ display: 'flex', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 2, mb: 1 }}>
  <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
    <Typography level='body2' color='neutral' sx={{ textAlign: 'center' }}>
      Level
    </Typography>
    <select value={level} onChange={handleLevelChange}>
    {Array.from({ length: 20 }, (_, i) => i + 1).map((level) => (
  <option key={level} value={level}>{level}</option>
))}

    </select>
  </Box>
  <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
    <Typography level='body2' color='neutral' sx={{ textAlign: 'center' }}>
      Experience
    </Typography>
    <Typography level='body2' color='neutral' sx={{ textAlign: 'center' }}>
      {experience}
    </Typography>
  </Box>
</Box>

{/* Add this section for Character Name field */}

<Box sx={{ display: 'flex', flexDirection: 'row', justifyContent: 'space-between', gap: 2, mb: 1, width: '100%' }}>
        <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <Typography level='body2' color='neutral' sx={{ textAlign: 'center' }}>
                Character Name
            </Typography>
            <Input
    fullWidth
    variant='outlined' color='neutral'
    value={characterName} onChange={(e) => setCharacterName(e.target.value)}
    placeholder='Enter character name…'
    sx={{
        boxShadow: theme.vars.shadow.sm,
    }}
/>
        </Box>
    </Box>


<Box sx={{ display: 'flex', flexDirection: 'row', justifyContent: 'space-between', gap: 2, mb: 1 }}>
  <Box sx={{ flex: 1 }}>
    <Typography level='body2' color='neutral'>
        Alignment
    </Typography>
    <select value={alignment} onChange={handleAlignmentChange}>
        {alignments.map((alignment) => (
            <option key={alignment} value={alignment}>{alignment}</option>
        ))}
    </select>
  </Box>
  <Box sx={{ flex: 1 }}>
    <Typography level='body2' color='neutral'>
        Race
    </Typography>
    <select value={race} onChange={handleRaceChange}>
        {races.map((race) => (
            <option key={race} value={race}>{race}</option>
        ))}
    </select>
  </Box>
</Box>

<Box sx={{ display: 'flex', flexDirection: 'row', justifyContent: 'space-between', gap: 2, mb: 1 }}>
  <Box sx={{ flex: 1 }}>
    <Typography level='body2' color='neutral'>
        Gender
    </Typography>
    <select value={gender} onChange={handleGenderChange}>
        {genders.map((gender) => (
            <option key={gender} value={gender}>{gender}</option>
        ))}
    </select>
  </Box>
  <Box sx={{ flex: 1 }}>
    <Typography level='body2' color='neutral'>
        Class
    </Typography>
    <select value={charClass} onChange={handleClassChange}>
        {genderFilteredClasses(gender).map((charClass) => (
            <option key={charClass} value={charClass}>{charClass}</option>
        ))}
    </select>
</Box>
</Box>

<Box sx={{ display: 'flex', flexDirection: 'row', justifyContent: 'space-between', gap: 2, mb: 1 }}>
  <Box sx={{ flex: 1 }}>
    <Typography>Hit Die: {hitDie}</Typography>
  </Box>
  <Box sx={{ flex: 1 }}>
    <Typography>Hit Points: {hitPoints}</Typography>
  </Box>
</Box>


<Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
  <Typography>Str: {str}</Typography>
  <Typography>Dex: {dex}</Typography>
  <Typography>Con: {con}</Typography>
  <Typography>Int: {int}</Typography>
  <Typography>Wis: {wis}</Typography>
  <Typography>Cha: {cha}</Typography>
  <Button onClick={handleButtonClick} disabled={rolls >= 3}>Roll Stats 🎲 </Button>
  <Typography>Attempts remaining: {3 - rolls}</Typography>
  <Button onClick={createCharacterSheet} disabled={characterName === "" || !rollButtonPressed} >Start Game</Button>
</Box>




      </Box>

    </Stack>

  </>;
}
