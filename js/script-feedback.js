jQuery(document).ready(function($) {
  // Feedback button function
  var Feedback = function() {
    var $fbk_content = $('#fbk-content'),
      $fbk_reply_box = $('#fbk-reply-box'),
      $fbk_list_body = $('.fbk-list-body')
      $feedback_submit_api = '/feedback/feedback_reply',
      $feedback_list_api = '/feedback/feedback_list',
      $feedback_support_api = '/feedback/feedback_like',
      $feedback_captcha_api = '/feedback/get_captcha';
    var is_reload = false;


    var load_data = function(api, post_data) {
        var return_data = '';
        var dataArray = [];

        $.ajax({
          type: 'POST',
          url: api,
          data: post_data,
          async: false,
          success: function(data) {

            if (data && data.success) {
              return_data = data;
              show_msg('我是测试消息！');
            } else show_msg('失败！！！');
          },
          dataType: 'json'
        });
        return return_data;
      };

    var remove_list = function() {
        $fbk_list_body.isotope('remove', $('.fbk-list-item'));
      };


    var list_item = function(data) {
        remove_list();
        addItem(data.feedback)
      };

    var clear_msg = function() {
        $fbk_reply_box.find('.message').html('').slideUp();
      };

    var show_msg = function(msg) {
        $fbk_reply_box.find('.message').html(msg).slideDown();
      };

    var addItem = function(data, is_reload) {

        var comment_tpl = '<li id="comment-{{id}}" class="fbk-list-item">\n \
            <div class="support-box">\n \
              <div class="support-num">\n \
                <a data-option-id="{{id}}" href="#support">\n \
                  <span>{{like_cnt}}</span>\n \
                </a>\n \
              </div>\n \
              <a data-option-id="{{id}}" class="support-text" href="#support">支持</a>\n \
            </div>\n \
            <div class="fbk-list-area">\n \
              <div class="fbk-list-content">\n \
                {{content}}\n \
                <a href="" class="more">展开&gt;&gt;</a>\n \
                <span class="arrow-down"></span>\n \
                <span class="arrow-down-border"></span>\n \
              </div>\n \
              <div class="fbk-list-author">\n \
                用户\n \
                <span class="name">{{name}}</span>\n \
                发表于\n \
                <span class="date">{{time_created}}</span>\n \
                <span class="state {{state_class}}">{{state}}</span>\n \
              </div>\n \
              <ul class="fbk-list-reply">\n \
              {{reply}}\n \
              </ul>\n \
            </div>\n \
          </li>';

        var reply_tpl = '<li id="reply-{{id}}" class="fbk-reply-item">\n \
                        <li class="fbk-reply-item">\n \
                  <div class="fbk-reply-content">{{content}}</div>\n \
                  <div class="fbk-reply-author">\n \
                    <span class="name">{{username}}</span>\n \
                    回复于\n \
                    <span class="date">{{time_created}}</span>\n \
                  </div>\n \
                </li>';


        var data_comment = data,
          data_reply, comment_tmp, reply_tmp;

        for (var each in data_comment) {
          var reply_list;
          data_reply = data_comment[each].reply;
          if (data_reply) {
            for (var each in data_reply) {
              reply_tmp = reply_tpl.replace(/\{\{id\}\}/, data_reply[each].id);
              reply_tmp = reply_tmp.replace(/\{\{content\}\}/, data_reply[each].content);
              reply_tmp = reply_tmp.replace(/\{\{username\}\}/, data_reply[each].username);
              reply_tmp = reply_tmp.replace(/\{\{time_created\}\}/, data_reply[each].time_created);
              reply_list += reply_tmp;
            }
          }

          comment_tmp = comment_tpl.replace(/\{\{like_cnt\}\}/, data_comment[each].like_cnt);
          comment_tmp = comment_tmp.replace(/\{\{id\}\}/, data_comment[each].id);
          comment_tmp = comment_tmp.replace(/\{\{content\}\}/, data_comment[each].content);
          comment_tmp = comment_tmp.replace(/\{\{name\}\}/, data_comment[each].name);
          comment_tmp = comment_tmp.replace(/\{\{time_created\}\}/, data_comment[each].time_created);
          comment_tmp = comment_tmp.replace(/\{\{state_class\}\}/, 'open');
          comment_tmp = comment_tmp.replace(/\{\{state\}\}/, '已采纳');
          comment_tmp = comment_tmp.replace(/\{\{reply\}\}/, reply_list);



          if (is_reload) {
            // add one new item
            $fbk_list_body.prepend($(comment_tmp)).isotope('reloadItems').isotope({
              sortBy: 'original-order'
            });
          } else {
            // reload all items
            $fbk_list_body.isotope('insert', $(comment_tmp));
          }
        }
      };

    var init_cookies = function(name, key) {
        if ($.cookie(name) == null) {
          $.cookie(name, '{"' + key + '":[]}', {
            expires: 7
          });
        }
      };

    var set_cookies = function(name, key, value) {
        var support_tmp = JSON.parse($.cookie(name));
        for (var each in support_tmp) {
          support_tmp[each][support_tmp[each].length] = value;
        }
        var str = JSON.stringify(support_tmp)
        $.cookie(name, str);
      };



    var feedback_load = function(type, sort, page) {
        var api_data = {
          "type": type,
          "sort": sort,
          "page": page
        };
        result = load_data($feedback_list_api, api_data);
        if (result) list_item(result)

      };
    var feedback_captcha = function() {

        $.get($feedback_captcha_api, function(data) {
          if (data) $fbk_reply_box.find('input[name=captcha]').val(data['captcha']);
        }, 'json');

      };

    var feedback_submit = function() {

        var content = $.trim($fbk_reply_box.find('textarea[name=content]').val()),
          email = $.trim($fbk_reply_box.find('input[name=email]').val()),
          url = $.trim($fbk_reply_box.find('input[name=url]').val()),
          name = $.trim($fbk_reply_box.find('input[name=name]').val()),
          mobile = $.trim($fbk_reply_box.find('input[name=mobile]').val()),
          is_agree = $fbk_reply_box.find('input[name=is_agree]').attr('checked') ? 1 : 0,
          captcha = $.trim($fbk_reply_box.find('input[name=captcha]').val());

        var api_data = {
          "content": content,
          "email": email,
          "url": url,
          "name": name,
          "mobile": mobile,
          "is_agree": is_agree,
          "captcha": captcha,
          "method": 'user.feedback_reply'
        };

        result = load_data($feedback_submit_api, api_data);
        //if(result)
        var api_data_tmp = {
          0: api_data
        }
        api_data_tmp[0].like_cnt = '0';

        addItem(api_data_tmp, true);



      };


    var init = function() {

        var type = 0,
          sort = 0,
          page = 1;

        var $submit_btn = $fbk_reply_box.find('input[type=submit]');

        //get captcha
        feedback_captcha();

        //init isotope
        $fbk_list_body.isotope({
          // options
          itemSelector: '.fbk-list-item',
          layoutMode: 'straightDown'
        });

        // set cookies for support tags
        init_cookies('supported', 'id');

        // init load
        feedback_load(type, sort, page);

        // init supported mark
        var supported_tag = JSON.parse($.cookie('supported')),
          supported_query = '';
        for (var i = 0; i < supported_tag['id'].length; i++) {
          supported_query += '#comment-' + supported_tag['id'][i] + ',';
        }
        $(supported_query).find('.support-text').addClass('checked').html('已支持');
        // bind submit
        $submit_btn.bind('click', function(event) {
          event.preventDefault();
          feedback_submit();
        });
        // bind sort
        $fbk_content.find('.fbk-sort a').bind('click', function(event) {
          event.preventDefault();
          sort = $(this).attr('data-option-id')
          feedback_load(type, sort, page);
        });
        // bind type
        $fbk_content.find('.fbk-type a').bind('click', function(event) {
          event.preventDefault();
          type = $(this).attr('data-option-id')
          feedback_load(type, sort, page);
        });
        // bind pagination
        $fbk_content.find('.fbk-pagination a').bind('click', function(event) {
          event.preventDefault();
          page = $(this).attr('data-option-id')
          feedback_load(type, sort, page);
        });
        // bind support
        $fbk_content.find('.support-box a').bind('click', function(event) {
          event.preventDefault();

          var id = $(this).parents().filter('li').attr('id').substr(8),
            support_cnt = $(this).parents().filter('.support-box').find('.support-num span'),
            support_text = $(this).parents().filter('.support-box').find('.support-text');

          var api_data = {
            "id": id,
          };
          if (!support_text.hasClass('checked')) {
            result = load_data($feedback_support_api, api_data);
            //if (result){
            support_cnt.html(parseInt(support_cnt.html()) + 1);
            support_text.addClass('checked').html('已支持');
            $.cookie('the_cookie', 'the_value', {
              expires: 7
            });
            set_cookies('supported', 'id', id)
            //}
          }
        });
      };
    return {
      init: init
    }
  }();
});