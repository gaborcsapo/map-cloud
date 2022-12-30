import { JourneyStage } from "./journeyStage.js"

export const TEST_JOURNEY = [
    new JourneyStage({
        "stageName": "Flight",
        "startDescription": "Vienna Internation Airport",
        "endDescription": "25.081604, 121.229958",
        "routeType": "plane",
        "narrationDuration": 0,
        "camMoveDuration": 0,
        "zoomDuration": 0,
        "markerTitle": "The journey begins!",
        "narrationText": "Flight G A B 4 5 1 to Taipei is ready to depart. We wish you a pleasant journey! Someone is eagerly waiting on the other side for you.",
        "language": "en-GB"
    }),
    new JourneyStage({
        "stageName": "Leaving the airport",
        "startDescription": "25.081604, 121.229958",
        "endDescription": "Taoyuan International Airport Terminal 2",
        "routeType": "teleportation",
        "narrationDuration": 0,
        "camMoveDuration": 0,
        "zoomDuration": 0,
        "markerTitle": "Welcome to Taiwan!!",
        "narrationText": "Welcome to Taiwan!! So excited to see you!",
        "language": "en-GB",
        "picture": "/resources/img/welcome-default.png"
    }),
    new JourneyStage({
        "stageName": "Car journey",
        "startDescription": "Taoyuan International Airport Terminal 2",
        "endDescription": "Taipei Zhongshan MRT station",
        "routeType": "car",
        "narrationDuration": 0,
        "camMoveDuration": 0,
        "zoomDuration": 0,
        "markerTitle": "Let's go to the city",
        "narrationText": "Let's go to the city to see all the coolest places!",
        "language": "en-GB"
    }),
    new JourneyStage({
        "stageName": "Car journey",
        "startDescription": "Taipei Zhongshan MRT station",
        "endDescription": "Taipei 101 Tower",
        "routeType": "car",
        "narrationDuration": 0,
        "camMoveDuration": 0,
        "zoomDuration": 0,
        "markerTitle": "The hotel is at Zhongshan",
        "narrationText": "This is Zhongshan, one of the bustling centers of Taipei. I love the mixture old and modern that you can experience when you walk along the 3km long Zhongshan Linear Park.",
        "language": "en-GB"
    }),
]

export const FAM_JOURNEY = [
    new JourneyStage({
        "stageName": "Flight",
        "startDescription": "Vienna Internation Airport",
        "endDescription": "25.081604, 121.229958",
        "routeType": "plane",

        "narrationDuration": 0,
        "camMoveDuration": 0,
        "zoomDuration": 0,
        "markerTitle": "Bécs",
        "narrationText": "Az EVA BR 66 járat készen áll az indulásra!!",
        "language": "hu-HU"
    }),
    new JourneyStage({
        "stageName": "Leaving the airport",
        "startDescription": "25.081604, 121.229958",
        "endDescription": "Taoyuan International Airport Terminal 2",
        "routeType": "teleportation",
        "narrationDuration": 0,
        "camMoveDuration": 0,
        "zoomDuration": 0,
        "markerTitle": "Üdv Tajvanon!!\n",
        "narrationText": "A reptéren várlak majd, ha sikerül felébrednem.",
        "language": "hu-HU",
        "picture": "/resources/img/welcome-default.png"
    }),
    new JourneyStage({
        "stageName": "Car journey",
        "startDescription": "Taoyuan International Airport Terminal 2",
        "endDescription": "220新北市板橋區華江一路201～235號",
        "routeType": "plane",
        "narrationDuration": 0,
        "camMoveDuration": 0,
        "zoomDuration": 0,
        "markerTitle": "Irány Banqiao",
        "narrationText": "Először haza megyünk és aludhattok egyet.",
        "language": "hu-HU"
    }),
    new JourneyStage({
        "stageName": "Car journey",
        "startDescription": "220新北市板橋區華江一路201～235號",
        "endDescription": "Qixingtan, Hualien",
        "routeType": "plane",
        "narrationDuration": 0,
        "camMoveDuration": 0,
        "zoomDuration": 0,
        "markerTitle": "Városnézés 18-tól 25-ig",
        "narrationText": "Az első héten nálam laktok és onnan megyünk helyekre mint például Dihua utca, a botanikus kert, a szórakozo negyed.",
        "language": "hu-HU"
    }),
    new JourneyStage({
        "stageName": "Car journey",
        "startDescription": "Qixingtan, Hualien",
        "endDescription": "220新北市板橋區華江一路201～235號",
        "routeType": "plane",
        "narrationDuration": 0,
        "camMoveDuration": 0,
        "zoomDuration": 0,
        "markerTitle": "Hualien 25-től 28-ig",
        "narrationText": "Ezeken a napokon, délebbre megyünk természetet lesni és kikapcsolodni a városi nyüzsgéstől távol",
        "language": "hu-HU"
    }),
    new JourneyStage({
        "stageName": "Car journey",
        "startDescription": "220新北市板橋區華江一路201～235號",
        "endDescription": "Luodong, Yilan County",
        "routeType": "plane",
        "narrationDuration": 0,
        "camMoveDuration": 0,
        "zoomDuration": 0,
        "markerTitle": "Vissza Tajpejbe 28-tól 30-ig",
        "narrationText": "A hétvégére visszajövünk, mert ilyenkor a vidék feltelik városiakkal, és nehezebb helyekre bejutni.",
        "language": "hu-HU"
    }),
    new JourneyStage({
        "stageName": "Car journey",
        "startDescription": "Luodong, Yilan County",
        "endDescription": "KDM Hotel, Taipei",
        "routeType": "plane",
        "narrationDuration": 0,
        "camMoveDuration": 0,
        "zoomDuration": 0,
        "markerTitle": "Yilan 30-tól 1-ig\n",
        "narrationText": "Yilan szintén vidéki terület Tajpejtol nem messze amit még én sem fedeztem fel. Tele van vízesésekkel, hőforrásokkal, és még talán teaültetvényekbe is bukkanhatunk.",
        "language": "hu-HU"
    }),
    new JourneyStage({
        "stageName": "Car journey",
        "startDescription": "KDM Hotel, Taipei",
        "endDescription": "220新北市板橋區華江一路201～235號",
        "routeType": "plane",
        "narrationDuration": 0,
        "camMoveDuration": 0,
        "zoomDuration": 0,
        "markerTitle": "Tajpej 1-től 9-ig",
        "narrationText": "Aztán a maradék időben Tajpej közepén fognak lakni az ősök, ahol végtelen mennyiségű menő helyet ismerek és ráadásul a hotelek sétálhato környékeken lesznek. Lehet szó fél napos vonatos kiruccanásokra igény szerint.",
        "language": "hu-HU"
    })
]