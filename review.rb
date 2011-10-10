require 'sinatra'
require 'rubygems'
require 'haml'
require './word-diff-parse'

REPO = 'c:\\users\\skermes\\projects\\css'
set :haml, :format => :html5, :ugly => true

def git(cmd)
	%x[cd #{REPO} && git #{cmd}]
end

get '/review/:branch' do
	#git('fetch')
	diff = git("diff -U10 --ignore-space-change master..#{params[:branch]}")
	@snippets = []
	diff.each_line do |line|
		if line.start_with?('diff')
			@snippets << { :content => line, :type => :header }
		elsif line.start_with?('index') or
			  line.start_with?('---') or
			  line.start_with?('+++')
			@snippets[-1][:content] += line
		elsif line.start_with?('@@')
			@snippets << { :content => line, :type => :separator }
		elsif line.start_with?('+')
			@snippets << { :content => line, :type => :addition }
		elsif line.start_with?('-')
			@snippets << { :content => line, :type => :subtraction }
		else
			@snippets << { :content => line, :type => :raw }
		end
	end
	@title = params[:branch]
	haml :review
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
