var React = require('react');

var error = React.createClass({
    render: function () {
        var err = this.props.error.toString();
        return (
            <div>
                <h1>Error</h1>
                <div>Error: {err}</div>
            </div>
        );
    }
});

module.exports = error;


