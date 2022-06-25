import { Router} from 'express';
const router = Router();

let global_idx = 0;

const view = {
    inc_idx: function() {
        ++global_idx; return;
    },
    get_idx: function() {
        return global_idx;
    },
    forms: [
        {
            title: "Departure Airport Location",
            def: "Vienna Internation Airport",
        },
        {
            title: "Pre-departure announcement",
            def: "Flight G A B 4 5 1 to Taipei is ready to depart. We wish you a pleasant journey!",
        },
        {
            title: "Destination Airport Location",
            def: "Taoyuan International Airport",
        },
        {
            title: "Airport Celebration Picture Link",
            def: "www.example.com/pic.jpg",
        },
        {
            title: "Announcement before car departure",
            def: "And now let's go to the city!"
        },
        {
            title: "Car Departure Location from Airport",
            def: "Taoyuan International Airport Terminal 2",
        },
        {
            title: "Car Destination",
            def: "Taipei Zhongshan MRT station",
        },
        {
            title: "Announcement at arrival",
            def: "This is Zhongshan, one of the centers of Taipei"
        },
        {
            title: "Sight location",
            def: "Banqiao Huajiang 1st road 235",
        },
        {
            title: "Announcement at sight",
            def: "arrived here",
        },
        {
            title: "Sight location",
            def: "Google TPKD Banqiao",
        },
        {
            title: "Announcement at sight",
            def: "This is google",
        },
        {
            title: "Sight location",
            def: "Taipei 101",
        },
        {
            title: "Announcement at sight",
            def: "Here's Taipei 1 0 1",
        },
        {
            title: "Sight location",
            def: "Yongkang Street Taipei",
        },
        {
            title: "Announcement at sight",
            def: "Yongkang street",
        },
    ]
};

router.get('/', (req, res) => {
    console.log(req.query);
    if(Object.hasOwn(req.query, "path"))
    {
        res.send(req.query);
    }

    if (global_idx != 0) {
        res.send("error: template rendering race condition. Please try again");

    } else {
        res.render('home', view, (error, html) => {
            global_idx = 0;
            res.send(html);
        });
    }
});

export default router ;
