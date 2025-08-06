# Gussing Game Frontend

A React based frontend for the word gussing game hosted at: [awindyend.com](https://awindyend.com)

## The Game

In this game each player gets a set of letters (starting with 1 and can go up to 4 during the game).
Each player then types all of the words that he can think of that contain all of the letters in his set.
For each correct word he guesses he gets a point.
After a player reaches 10 points (default is 10, can be changed in the settings), all the other players in the game recieve another letter to their set which they then must use.
The game can end in one of 2 ways:
- The time runs out (default game duration is 2 minutes but this can also be changed in the settings)
- A player has reached the victory threshold set in the settings

## Features

- Single-player game (with configurable settings)
- Multi-player game (only the creator of the lobby is allowed to change settings)
- Social network ->
  - Register or Log in
  - Add players as friends and invite them to 1v1s
  - Chat with friends (WIP)
  - See who is online

## Tech Stack

![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)
![Tailwind CSS](https://img.shields.io/badge/TailwindCSS-38B2AC?style=for-the-badge&logo=tailwindcss&logoColor=white)
![Socket.IO](https://img.shields.io/badge/Socket.IO-010101?style=for-the-badge&logo=socket.io&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-646CFF?style=for-the-badge&logo=vite&logoColor=white)

## Build and Run

1. Clone the repository
2. Install dependencies - ```pnpm i```
3. Either **build** or **run dev server** ->
    - Build - ```pnpm run build```
    - Run dev server - ```pnpm run dev```
  
## ENV Variables
- VITE_API_BASE_URL = https:// The domain name of the backend
- VITE_API_BASE_SOCKET_URL = wss:// The domain name of the backend
- These should be the same as configured in the backend (should not be different unless the backend is changed)
  - VITE_API_GAME_NAMESPACE=game
  - VITE_API_LOBBY_NAMESPACE=lobby
  - VITE_API_CHAT_NAMESPACE=chat
  - VITE_API_GAME_ROUTE=game

## TODO List
- [x] Add typing indicators
- [ ] Add a sidebar in the chat window that shows all of the chats
  - [ ] Add individual unread messages counts in this sidebar
- [ ] Add general unread messages count on the minimised chat button
- [ ] Add debounce to the timer (if the difference between the forntend game timer and the truth, dont update it to avoid stuttering)
 
## Structure

Most of the logic is encapsulated in the contexts, or at least should be.
Currently some components do some heavy lifting as well namely Index, so this is a work in progress.

```
src/
├── api/ # Handles API calls (auth, chat, friends, game logic)
├── components/ # UI components (auth, game, social, reusable UI)
├── contexts/ # React contexts for managing global state
├── types/ # TypeScript types
├── lib/ # Utility functions
├── assets/ # Static assets (images, icons)
├── App.tsx # Main application component
├── main.tsx # Entry point
└── styles/ # Global and app-level styles
```


Complete structure:
```
src/
├── api/ # Handle api calls to the backend
│   ├── auth.ts # Handles mainly Login and register calls
│   ├── chats.ts # Handles the chat calls (getChats, getMessages(chat))
│   ├── friends.ts # Handles friend calls (mainly fetching friends and friend requests)
│   └── game.ts # Used for singleplayer for handling games in the frontend (validate words, get letter sets)
├── components/
│   ├── auth/ # Authentication related components
│   │   ├── AuthPage.tsx # Main authentication page wrapper
│   │   ├── Login.tsx # Login form component
│   │   ├── Register.tsx # Registration form component
│   │   └── PrivateRoute.tsx # Route protection component
│   ├── game/ # Game-related components
│   │   ├── Game.tsx # Main game component
│   │   ├── SingleGame.tsx # Single player game implementation
│   │   ├── GameContent.tsx # Game content wrapper
│   │   ├── GameHeader.tsx # Game header component
│   │   ├── GameDialogs.tsx # Game dialog components
│   │   ├── GameSettingsMenu.tsx # Game settings menu
│   │   ├── GameResultsPanel.tsx # Results display panel
│   │   ├── GameInvites.tsx # Game invitation component
│   │   ├── Lobby.tsx # Game lobby component
│   │   ├── PlayerPanel.tsx # Player information panel
│   │   ├── LeaderBoard.tsx # Leaderboard component
│   │   ├── LeaderBoardItem.tsx # Individual leaderboard item
│   │   ├── ResultScores.tsx # Score display component
│   │   ├── WordsList.tsx # List of words component
│   │   └── DynamicTextArea.tsx # Dynamic text input area
│   ├── social/ # Social features components
│   │   ├── ChatWindow.tsx # Main chat interface
│   │   ├── UserList.tsx # List of users component
│   │   ├── UserCard.tsx # Individual user card
│   │   ├── AddFriend.tsx # Add friend functionality
│   │   ├── Incoming.tsx # Incoming friend requests
│   │   └── Outgoing.tsx # Outgoing friend requests
│   ├── ui/ # Reusable UI components
│   │   ├── button.tsx # Button component
│   │   ├── dialog.tsx # Dialog/modal component
│   │   ├── alert-dialog.tsx # Alert dialog component
│   │   ├── dropdown-menu.tsx # Dropdown menu component
│   │   └── sonner.tsx # Toast notification component
│   ├── settings/ # Settings components (empty directory)
│   ├── Header.tsx # Main header component
│   ├── Home.tsx # Home page component
│   ├── Index.tsx # Main index component
│   ├── Privacy.tsx # Privacy policy page
│   └── Sidebar.tsx # Sidebar navigation component
├── contexts/ # React context providers
│   ├── AuthContext.tsx # Authentication state management
│   ├── ChatContext.tsx # Chat state management
│   ├── GameContext.tsx # Game state management
│   └── SocialContext.tsx # Social features state management
├── types/ # TypeScript type definitions
│   ├── AnimationState.ts # Animation state types
│   ├── Chat.ts # Chat-related types
│   ├── GameState.ts # Game state types
│   ├── GameResults.ts # Game results types
│   ├── GameStatus.ts # Game status types
│   ├── PlayerData.ts # Player data types
│   ├── PlayerErrors.ts # Player error types
│   └── User.ts # User-related types
├── lib/ # Utility libraries
│   └── utils.ts # General utility functions
├── assets/ # Static assets
│   └── react.svg # React logo
├── App.tsx # Main application component
├── App.css # Application styles
├── index.css # Global styles
├── main.tsx # Application entry point
└── vite-env.d.ts # Vite environment types
```