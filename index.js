const bcrypt = require('bcrypt')
const SALT_ROUNDS = 10

const jwt = require('jsonwebtoken')
const dotenv = require('dotenv')
dotenv.config()
const TOKEN_SECRET = process.env.TOKEN_SECRET

const mysql = require('mysql');
const connection = mysql.createConnection({
    host: 'localhost',
    user: 'admin',
    password: 'admin',
    database: 'test'
});

connection.connect();

const express = require('express')
const app = express()
const port = 4000


function authenticateToken(req, res, next) {
    const authHeader = req.headers['authorization']
    const token = authHeader && authHeader.split(' ')[1]
    if (token == null) return res.sendStatus(403)
    jwt.verify(token, TOKEN_SECRET, (err, user) => {
        if (err) { return res.sendStatus(401) }
        else {
            req.user = user
            next()
        }
    })
}




app.post("/login", (req, res) => {
    let username = req.query.username
    let password = req.query.password
    let query = `SELECT * FROM Users WHERE username='${username}'`

    connection.query(query, (err, rows) => {
        if (err) {
            console.log(err)
            res.json({
                "status": "400",
                "message": "Error querying from db"
            })
        } else {

            let db_password = rows[0].password
            bcrypt.compare(password, db_password, (err, result) => {
                if (result) {
                    let payload = {
                        "username": rows[0].username,
                        "user_id": rows[0].user_id,
                        "IsAdmin": rows[0].IsAdmin
                    }
                    console.log(payload)
                    let token = jwt.sign(payload, TOKEN_SECRET, { expiresIn: '1d' })
                    res.send(token)
                } else { res.send("Invalid username / password") }
            })
        }
    })
})




//CRUD for Users Table

app.post("/register", (req, res) => {

    let username = req.query.username
    let email = req.query.email
    let password = req.query.password

    bcrypt.hash(password, SALT_ROUNDS, (err, hash) => {

        let query = `INSERT INTO Users
                                    (username, email,password, IsAdmin) 
                                    VALUES ('${username}', '${email}', '${hash}', false)`

        console.log(query)

        connection.query(query, (err, rows) => {
            if (err) {
                res.json({
                    "status": "400",
                    "message": "Error inserting data into db"
                })
            } else {
                res.json({
                    "status": "200",
                    "message": "Adding new user successful"
                })
            }
        });
    })
});



app.get("/user", authenticateToken, (req, res) => {
    if (!req.user.IsAdmin) { res.sendStatus(401) }
    else {
        query = "SELECT * from Users";
        connection.query(query, function (err, rows) {
            if (err) {
                res.json({ "status": "400" })
            }
            else {
                res.json(rows)
            }
        });
    }
})



app.post("/update_user", authenticateToken, (req, res) => {

    let user_id = req.query.user_id

    if (!req.user.IsAdmin) { res.sendStatus(401) }
    else {
        let username = req.query.username
        let email = req.query.email
        let password = req.query.password

        bcrypt.hash(password, SALT_ROUNDS, (err, hash) => {

            let query = `UPDATE Users SET
                    username='${username}',
                    password='${hash}',
                    email='${email}',
                    updated_at = NOW()                    
                    WHERE user_id=${user_id}`

            console.log(query)

            connection.query(query, (err, rows) => {
                if (err) {
                    res.json({
                        "status": "400",
                        "message": "Error updating user"
                    })
                } else {
                    res.json({
                        "status": "200",
                        "message": "Updating user successful"
                    })
                }
            });
        })
    }
});



app.post("/delete_user", authenticateToken, (req, res) => {


    if (!req.user.IsAdmin) { res.sendStatus(401) }
    else {

        let user_id = req.query.user_id


        let query = `DELETE FROM Users WHERE user_id=${user_id}`

        console.log(query)

        connection.query(query, (err, rows) => {
            if (err) {
                res.json({
                    "status": "400",
                    "message": "Error deleting user"
                })
            } else {
                res.json({
                    "status": "200",
                    "message": "Deleting user successful"
                })
            }
        });

    }
})


//CRUD for Tasks Table

app.post("/add_task", (req, res) => {

    let title = req.query.title
    let description = req.query.description
    let status = req.query.status
    let priority = req.query.priority
    let due_date = req.query.due_date

    let user_id = req.query.user_id


    let query = `INSERT INTO Tasks (title, description, status, priority,due_date, user_id) 
             VALUES ('${title}', '${description}', '${status}', '${priority}','${due_date}', ${user_id})`;

    console.log('Executing query:', query);

    connection.query(query, (err, rows) => {
        if (err) {
            console.error('Error inserting task:', err);
            res.json({
                "status": "400",
                "message": "Error inserting task"
            });
        } else {
            res.json({
                "status": "200",
                "message": "Adding new task successful"
            });
        }
    });



});

app.get("/task", authenticateToken, (req, res) => {

    if (!req.user.IsAdmin) { res.sendStatus(401) }
    else {

        query = "SELECT * from Tasks";
        connection.query(query, function (err, rows) {
            if (err) {
                res.json({ "status": "400" })
            }
            else {
                res.json(rows)
            }
        });
    }
})

app.post("/update_task", authenticateToken, (req, res) => {

    if (!req.user.IsAdmin) { res.sendStatus(401) }
    else {
        let task_id = req.query.task_id
        let title = req.query.title
        let description = req.query.description
        let status = req.query.status
        let priority = req.query.priority
        let due_date = req.query.due_date


        let query = `UPDATE Tasks SET
                    title='${title}',
                    description='${description}',
                    status='${status}',
                    priority='${priority}',
                    due_date='${due_date}',
                    updated_at = NOW()                    
                    WHERE task_id=${task_id}`

        console.log(query)

        connection.query(query, (err, rows) => {
            if (err) {
                res.json({
                    "status": "400",
                    "message": "Error updating task"
                })
            } else {
                res.json({
                    "status": "200",
                    "message": "Updating task successful"
                })
            }
        });

    }
});

app.post("/delete_task", authenticateToken, (req, res) => {


    if (!req.user.IsAdmin) { res.sendStatus(401) }
    else {

        let task_id = req.query.task_id

        let query = `DELETE FROM Tasks WHERE task_id=${task_id}`

        console.log(query)

        connection.query(query, (err, rows) => {
            if (err) {
                res.json({
                    "status": "400",
                    "message": "Error deleting task"
                })
            } else {
                res.json({
                    "status": "200",
                    "message": "Deleting task successful"
                })
            }
        });

    }
})

//CRUD for Comments

app.post("/create_comment", (req, res) => {

    let comment = req.query.comment

    let task_id = req.query.task_id





    let query = `INSERT INTO Comments
                 (comment, task_id) 
                 VALUES ('${comment}','${task_id}')`

    console.log(query)

    connection.query(query, (err, rows) => {
        if (err) {
            res.json({
                "status": "400",
                "message": "Error inserting comment "
            })
        } else {
            res.json({
                "status": "200",
                "message": "Adding new comment successful"
            })
        }
    });

});

app.post("/update_comment", authenticateToken, (req, res) => {


    let comment_id = req.query.comment_id
    let comment = req.query.comment

    let query = `UPDATE Comments SET
                    comment='${comment}',                    
                    updated_at = NOW()                    
                    WHERE comment_id=${comment_id}`

    console.log(query)

    connection.query(query, (err, rows) => {
        if (err) {
            res.json({
                "status": "400",
                "message": "Error updating comment"
            })
        } else {
            res.json({
                "status": "200",
                "message": "Updating comment successful"
            })
        }
    });


});

app.post("/delete_comment", authenticateToken, (req, res) => {


    if (!req.user.IsAdmin) { res.sendStatus(401) }
    else {

        let comment_id = req.query.comment_id

        let query = `DELETE FROM Comments WHERE comment_id=${comment_id}`

        console.log(query)

        connection.query(query, (err, rows) => {
            if (err) {
                res.json({
                    "status": "400",
                    "message": "Error deleting comment"
                })
            } else {
                res.json({
                    "status": "200",
                    "message": "Deleting comment successful"
                })
            }
        });

    }
})




//Show data from Tasks and Comments


app.get("/taskcomment", authenticateToken, (req, res) => {

    if (!req.user.IsAdmin) {
        res.sendStatus(401);
    } else {
        let query = `SELECT 	
            Tasks.task_id, Tasks.title, Tasks.description, Tasks.status, Tasks.priority, Tasks.due_date, Tasks.created_at, Tasks.updated_at,
            Comments.comment_id, Comments.comment
        FROM
            Tasks
        JOIN 
            Comments
        ON 
            Tasks.task_id = Comments.task_id`;

        connection.query(query, (err, rows) => {
            if (err) {
                console.error('Error executing query:', err);
                res.json({ "status": "400" });
            } else {
                res.json(rows);
            }
        });
    }
});




app.listen(port, () => {
    console.log("Now starting testbackend at port " + port)

})


