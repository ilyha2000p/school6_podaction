var fs = require('fs');
var request = require('request');

var url_module = require('url');

var express = require('express');
var app = express();

var mysql = require('mysql');

var consolidate = require('consolidate');

app.engine('hbs', consolidate.handlebars);	//движком для шоблонов с расширением .hbs будет handlebars
app.set('view engine', 'hbs');	//чтобы не указывать расширение .hbs
app.set('views', '../admin_pages/hbs_views/');
//app.set('views', '../../public/sections_pages/news/');	//каталог с шаблонизаторами

var bodyParser = require('body-parser');
// parse application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({extended: true}))
// parse application/json
app.use(bodyParser.json())

const auth = require('basic-auth');

function authMiddleware(req, res, next) {
    let user = auth(req);

    if (user === undefined || user.name !== 'admin_elena_debelaya_admin' || user.pass !== '12345') {
        res.statusCode = 401;
        res.setHeader('WWW-Authenticate', 'Basic realm="MyRealmName"');
        res.end('Unauthorized');
    } else {
        next();
    }
}






app.use('/admin', authMiddleware);
app.use('/news_admin', authMiddleware);
app.use('/open_edit_article_page', authMiddleware);
app.use('/add_article', authMiddleware);
app.use('/remove_article', authMiddleware);





//main++++++++++++++++++++++++++++++++++++++++++++
app.use('/', express.static('../../public/'));







//news--------------------------------------------
var connection_articles_db = mysql.createConnection({
	host: 'localhost',
	user: 'root',
	password: '12345',
	database: 'articles'
});
connection_articles_db.connect();

var articles_list_context = {
	values : []
}

function articles_list_query_db(){
	articles_list_context.values = [];

	connection_articles_db.query('SELECT * FROM articles_list', function(errors, result){
		for(var i=(result.length-1); i>=0; i--)
		{
			articles_list_context.values.push({
				id : result[i].id,
				article_name : result[i].name,
				text : result[i].text,
				dd : result[i].dd,
				mm : result[i].mm,
				yyyy : result[i].yyyy
			});
		}	
	});
}

articles_list_query_db();

//________

app.get('/news', function(req, res){
	res.render('news', articles_list_context);
});






//opened_article-----------------------------------------
app.post('/opened_article', function(req, res){
	var article_id = req.body.article_id;

	for(var i=0; i<articles_list_context.values.length; i++)
	{
		if(articles_list_context.values[i].id == article_id)
		{
			res.render('opened_article', articles_list_context.values[i]);
		}
	}
});










 




//admin+++++++++++++++++++++++++++++++++++++++++++
//________

app.get('/admin', function(req, res){
	fs.ReadStream('../admin_pages/admin.html').pipe(res);
	//res.render('authorization', context_authorization);
});



//news_admin---------------------------------------
app.get('/news_admin', function(req, res){
	res.render('news_admin', articles_list_context);
});






//open_add_article_page-----------------------------
var open_add_article_page_context = {
	title : 'Добавить статью',
	url_query : '/add_article',
	form_id : 'add_article_form'
}

//__________

app.get('/open_add_article_page', function(req, res){
	res.render('edit_article', open_add_article_page_context);
});






//add_article--------------------------------------
app.post('/add_article', function(req, res){
	var add_article_values = [
		req.body.article_name,
		req.body.article_text,
		req.body.dd,
		req.body.mm,
		req.body.yyyy
	]

	connection_articles_db.query('INSERT INTO articles_list VALUES (NULL, ?, ?, ?, ?, ?)', add_article_values, function(errors, result){
		articles_list_query_db();
	});

	res.redirect('/news_admin');
});





//remove_article-----------------------------------
app.post('/remove_article', function(req, res){
	connection_articles_db.query('DELETE FROM articles_list WHERE id = ?', req.body.id_for_remove, function(errors, result){
		articles_list_query_db();

		res.redirect('/news_admin');
	});
});



var open_edit_article_page_context = {};

//open_edit_article_page---------------------------
app.post('/open_edit_article_page', function(req, res){
	connection_articles_db.query('SELECT * FROM articles_list WHERE id = ?', req.body.id_for_edit, function(errors, result){
		open_edit_article_page_context = {
			title : 'Редактировать статью',
			url_query : '/edit_article',
			form_id : 'edit_article_form',

			article_id : result[0].id,
			article_name : result[0].name,
			article_text : result[0].text,
			dd : result[0].dd,
			mm : result[0].mm,
			yyyy : result[0].yyyy
		}

		res.render('edit_article', open_edit_article_page_context);
	});
});





//edit_article--------------------------------------
app.post('/edit_article', function(req, res){
	var edit_articles_values = [
		req.body.article_name,
		req.body.article_text,
		req.body.dd,
		req.body.mm,
		req.body.yyyy,
		req.body.article_id
	]

	connection_articles_db.query('UPDATE articles_list SET name = ?, text = ?, dd = ?, mm = ?, yyyy = ? WHERE id = ?', edit_articles_values, function(errors, result){
		articles_list_query_db();
		res.redirect('/news_admin');
	});
});






//gallery-------------------------------------------
app.get('/gallery', function(req, res){
	var folder_names_list_context = {
		values : []
	}

	fs.readdir('../../public/sections_pages/photo_gallery/opened_folder/plugins/slick_gallery/slides/', function(err, files){
		for(var i=0; i<files.length; i++)
		{
			folder_names_list_context.values.push({
				folder_name : files[i]
			});
		}
	})

	res.render('photo_gallery', folder_names_list_context);
});





//opened_folder-------------------------------------
app.post('/opened_folder', function(req, res){
	var opened_folder_context = {
		folder_name : req.body.folder_name,
		values : []
	}

	fs.readdir('../../public/sections_pages/photo_gallery/opened_folder/plugins/slick_gallery/slides/' + opened_folder_context.folder_name + '/', function(err, files){
		for(var i=0; i<files.length; i++)
		{
			opened_folder_context.values.push({
				folder_name : req.body.folder_name,
				img_name : files[i]
			});
		}
	})

	res.render('opened_folder', opened_folder_context);
});

app.listen(3003);