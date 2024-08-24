var createError = require('http-errors');
var express = require('express');
const cluster = require('cluster');
const os = require('os');
const numCPUs = os.cpus().length;
const router = require('./routes/users');

var app = express();


app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use('/api',router)



if (cluster.isMaster) {
    console.log(`Master ${process.pid} is running`);

    // Fork workers.
    for (let i = 0; i < 2; i++) {  // 2 replica sets
        cluster.fork();
    }

    cluster.on('exit', (worker, code, signal) => {
        console.log(`Worker ${worker.process.pid} died`);
        cluster.fork();  // Ensure the worker is replaced
    });
} else {
  app.listen(8080, () => {
        console.log(`Worker ${process.pid} started`);
    });
}





// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;
