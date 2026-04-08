from back_research import main


def test_main_runs(capsys) -> None:
    main()
    captured = capsys.readouterr()
    assert captured.out.strip() == "back_research workspace is ready"
