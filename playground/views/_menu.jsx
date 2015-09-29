var React = require('react');

var Menu = React.createClass({
    propTypes: {
        title: React.PropTypes.string
    },
    render: function() {
        return ( <b>Menu</b> );
    }
});

module.exports = Menu;


