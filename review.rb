require 'sinatra'
require 'rubygems'
require 'haml'
require './diffparse'

# site-specific configuration
REPO = 'c:\\users\\skermes\\projects\\css'
REMOTE_BRANCHES = false
REMOTE_NAME = 'origin'

set :haml, :format => :html5, :ugly => true

def git(cmd)
	%x[cd #{REPO} && git #{cmd}]
end

def review(from_branch, to_branch)
	if REMOTE_BRANCHES
		git('fetch')
	end
	branch_prefix = REMOTE_BRANCHES ? REMOTE_NAME + '/' : ''
	diff = git("diff -U10 --ignore-space-change #{branch_prefix}#{from_branch}...#{branch_prefix}#{to_branch}")
	@snippets = DiffParsing.parse(:unified, diff)
	@title = to_branch
	haml :review, :escape_html => true
end

get '/review/:branch' do
	review('master', params[:branch])
end

get '/review/:from/to/:to' do
	review(params[:from], params[:to])
end

post '/:id' do
	review = File.new("#{params[:id]}.diffbody", 'w')
	review.write(params[:diff].tr("\r", ''))
	review.close
end

get '/:id' do
	reviewfile = File.open("#{params[:id]}.diffbody", 'r')
	@review = reviewfile.read
	reviewfile.close
	@title = params[:id]
	haml :reviewed
end
