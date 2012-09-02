require 'sinatra'
require 'rubygems'
require 'haml'
require './diffparse'
require './config'

unless RbConfig.prop(:repositories).length > 0
    STDERR.puts 'You must configure at least one repository.  See README for details.'
end

set :haml, :format => :html5, :ugly => true

def git(repo, cmd)
    %x[cd #{RbConfig.repo_loc(repo)} && git #{cmd}]
end

def review(repo, from_branch, to_branch)
    return [404, haml(:repo404, :locals => { :repo => repo, :repo_names => RbConfig.repo_names() })] unless RbConfig.has_repo?(repo)
    @branches = branches(repo)    
    return [404, haml(:branch404, :locals => { :branch => to_branch })] unless @branches.index(to_branch) != nil
    return [404, haml(:branch404, :locals => { :branch => from_branch })] unless @branches.index(from_branch) != nil

    remote = RbConfig.repo_remote?(repo)
    remote_name = RbConfig.repo_remote_name(repo)
    if remote
        git(repo, "fetch #{remote_name}")
    end
    branch_prefix = remote ? remote_name + '/' : ''
    @shortstat = git(repo, "diff --no-color --shortstat -M #{branch_prefix}#{from_branch}...#{branch_prefix}#{to_branch}")
    diff = git(repo, "diff -U10 --no-color --ignore-space-change -M #{branch_prefix}#{from_branch}...#{branch_prefix}#{to_branch}")
    @branch_text = git(repo, "log --no-color -n1 --pretty=medium #{branch_prefix}#{to_branch}")
    @parent_text = git(repo, "log --no-color -n1 --pretty=medium #{branch_prefix}#{from_branch}")
    @snippets = DiffParsing.parse(:unified, diff)
    @branch = to_branch
    @parent = from_branch
    @repo = repo
    haml :review, :escape_html => true
end

def branches(repo)
    if RbConfig.repo_remote?(repo)
        git(repo, "ls-remote -h #{RbConfig.repo_remote_name(repo)}").lines.collect { |line| line[52..-1].chomp }
    else
        git(repo, 'branch --no-color').lines.collect { |line| line[2..-1].chomp }
    end
end

def reviews(repo)
    return [] unless Dir.exists?(repo)
    diffs = Dir.entries(repo).select { |entry| entry.end_with? '.diffbody' }
    diffs.collect { |diff| diff[0..-10] }
end

get '/review/?' do
    @repo_names = RbConfig.repo_names()
    haml :repolist
end

get '/review/:repository/?' do
    @repo = params[:repository]
    return [404, haml(:repo404, :locals => { :repo => @repo, :repo_names => RbConfig.repo_names() })] unless RbConfig.has_repo?(@repo)
    remote = RbConfig.repo_remote?(@repo)
	branch_switch = remote ? '-r' : ''
	output = git(@repo, "branch --no-color #{branch_switch}")
	amt_to_remove = 2 + (remote ? RbConfig.repo_remote_name(@repo).length + 1 : 0)
	@branches = branches(@repo)
	@reviews = reviews(@repo)
	haml :index
end

get '/review/:repository/:branch/?' do
    review(params[:repository], 'master', params[:branch])
end

get '/review/:repository/:from/to/:to/?' do
    review(params[:repository], params[:from], params[:to])
end

post '/:repository/:id/?' do |repository, id|
    if not Dir.exists?(repository)
        Dir.mkdir(repository)
    end
    review = File.new("#{repository}/#{id}.diffbody", 'w')
    review.write(params[:diff].tr("\r", ''))
    review.close
end

get '/:repository/:id/?' do |repository, id|
    @repo = repository
    return [404, haml(:repo404, :locals => { :repo => @repo, :repo_names => RbConfig.repo_names() })] unless RbConfig.has_repo?(@repo)
    diffbody = "#{repository}/#{id}.diffbody"
    return [404, haml(:diff404, :locals => { :id => id, :reviews => reviews(@repo) })] unless File.exists?(diffbody)
    reviewfile = File.open(diffbody, 'r')
    @review = reviewfile.read
    reviewfile.close
    @title = id    
    haml :reviewed
end
