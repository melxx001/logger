var express = require('express');
var router = express.Router();

/* GET some page. */
router.get('/logger', function (req, res, next) {
	res.render('index', {
        title: 'Page Title',
        sess: req2.session
    });
});

/*router.get('/logger/logtest', function (req, res, next) {
	res.render('index', {
        title: 'Page Title',
        sess: req.session
    });
});

router.get('/logger/fileoutput', function (req, res, next) {
	res.render('index', {
        title: 'Page Title',
        sess: req.session
    });
});

router.get('/logger/formatter', function (req, res, next) {
	res.render('index', {
        title: 'Page Title',
        sess: req.session
    });
});*/

module.exports = router;
