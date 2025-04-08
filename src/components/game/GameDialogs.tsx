import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"

interface GameDialogsProps {
    showAloneDialog: boolean;
    gamePaused: boolean;
    onContinuePlaying: () => void;
    onLeaveGame: () => void;
    setShowAloneDialog: (show: boolean) => void;
}

const GameDialogs = ({
    showAloneDialog,
    gamePaused,
    onContinuePlaying,
    onLeaveGame,
    setShowAloneDialog
}: GameDialogsProps) => {
    return (
        <>
            <Dialog open={showAloneDialog} onOpenChange={setShowAloneDialog}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>All other players left the game</DialogTitle>
                        <DialogDescription>
                            You can either continue playing alone or leave the game
                        </DialogDescription>
                    </DialogHeader>
                    <Button onClick={onContinuePlaying}>Continue Playing</Button>
                    <Button variant="destructive" onClick={onLeaveGame}>Leave Game</Button>
                </DialogContent>
            </Dialog>

            <Dialog open={gamePaused} onOpenChange={() => { }}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle className="text-center text-2xl">Game Paused</DialogTitle>
                        <DialogDescription className="text-center">
                            Waiting for player to reconnect...
                        </DialogDescription>
                    </DialogHeader>

                    <div className="flex flex-col items-center justify-center py-4">
                        <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-indigo-600 mb-6"></div>

                        <div className="w-full bg-gray-200 rounded-full h-2.5 dark:bg-gray-700 mt-2">
                            <div className="bg-indigo-600 h-2.5 rounded-full animate-pulse" style={{ width: '100%' }}></div>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        </>
    );
};

export default GameDialogs;