var React = require('react'),
    Menu = require('./_menu'),
    Footer = require('./_footer')
;

var Layout = React.createClass({
    propTypes: {
        title: React.PropTypes.string
    },
    getDefaultProps : function() {
        return {
            title : "Page Title"
        };
    },
    render: function() {
        return (
            <html>
                <head>
                    <meta charSet="utf-8" />
                    <meta httpEquiv="X-UA-Compatible" content="IE=Edge" />
                    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
                    <title>{this.props.title}</title>
                    <link rel="stylesheet" href="/public/css/stylesheets/style.css" type="text/css "/>
                </head>
                <body>
                    <h1>{this.props.title}</h1>
                    <div>
                        <Menu/>
                    </div>
                    <div>
                        {this.props.content}
                    </div>
                    <div>
                        <Footer/>
                    </div>
                </body>
            </html>
        );
    }
});

module.exports = Layout;
