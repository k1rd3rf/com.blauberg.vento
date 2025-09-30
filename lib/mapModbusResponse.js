module.exports = (result) => {
    if (result != null) {
        let unittypelabel = 'Vento Expert';
        switch (result.packet._dataEntries[11].value["0"]) {
            case 1:
                unittypelabel = 'Vento Expert A50-1 W V.2 | Vento Expert A85-1 W V.2 | Vento Expert A100-1 W V.2';
                break;
            case 4:
                unittypelabel = 'Vento Expert Duo A30-1 W V.2';
                break;
            case 5:
                unittypelabel = 'Vento Expert A30 W V.2';
                break;
            default:
                unittypelabel = 'Vento Expert';
                break;
        }

        return {
            onoff: result.packet._dataEntries[0].value["0"],
            speed: {
                mode: result.packet._dataEntries[1].value["0"],
                manualspeed: result.packet._dataEntries[2].value["0"],
            },
            boost: {
                mode: result.packet._dataEntries[3].value["0"],
                deactivationtimer: result.packet._dataEntries[4].value["0"],
            },
            operationmode: result.packet._dataEntries[5].value["0"],
            filter: {
                alarm: result.packet._dataEntries[6].value["0"],
                timer: {
                    min: result.packet._dataEntries[7].value["0"],
                    hour: result.packet._dataEntries[7].value["1"],
                    days: result.packet._dataEntries[7].value["2"],
                },
            },
            humidity: {
                current: result.packet._dataEntries[8].value["0"],
                sensoractivation: result.packet._dataEntries[9].value["0"],
                threshold: result.packet._dataEntries[10].value["0"],
                activated: 0,
            },
            unittype: unittypelabel,
            fan: {
                rpm: result.packet._dataEntries[12].value["0"],
            },
            timers: {
                mode: result.packet._dataEntries[13].value["0"],
                countdown: {
                    sec: result.packet._dataEntries[15].value["0"],
                    min: result.packet._dataEntries[15].value["1"],
                    hour: result.packet._dataEntries[15].value["2"],
                },
            },
            alarm: result.packet._dataEntries[14].value["0"],
        }
    }
    throw new Error("device not responding, is your device password correct?");
};
