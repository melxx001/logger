var React = require('react');
var Layout = require('./layout');

var Content = React.createClass({
    propTypes: {
        title: React.PropTypes.string
    },
    render: function () {
        var model = this.props.sess;
        return (
            <div>
                <div><b>FullName:</b> {model.FullName}</div>
                <div><b>First Name:</b> {model.FirstName}</div>
                <div><b>Last Name:</b> {model.LastName}</div>
            </div>
        );
    }
});

var Index = React.createClass({
    propTypes: {
        title: React.PropTypes.string
    },
    render: function() {
        return (
            <Layout title={this.props.title} content={<Content {...this.props}/>}>

            </Layout>
        );
    }
});

module.exports = Index;
